'use strict'

const {Log: StdioLog} = require('stdio_log')
const {Node, NodeResponse} = require('./node')
const {
    UInt,
    UInt64,
    PInt64,
    Timespan,
    Timestamp,
    DataSize,
    validateInstanceMap,
    validateArrayItems,
    validateInstance
} = require('minitype')
const {
    BadError,
    Result,
    ByteData32,
    EthEndpoint,
    HttpEndpoint,
    EndpointQuota,
    Block,
    LogFilter,
    Log,
    Transaction,
    BigMath
} = require('./type')
const {
    NODE_OVERLOADING,
    NODE_BAD_RESPONSE,
    NODE_BAD_SERVER,
    NODE_UNSAFE_BLOCK,
    NODE_REQUEST_QUOTA
} = require('./type').ErrorCode

const UINT_1 = UInt.fromNumber(1).open()
const UINT_2 = UInt.fromNumber(2).open()
const SECONDS_6 = Timespan.fromSeconds(6).open()
const SECONDS_15 = Timespan.fromSeconds(15).open()
const SECONDS_30 = Timespan.fromSeconds(30).open()
const MINUTES_1 = Timespan.fromMinutes(1).open()

/**
 * @typedef {object} SafeBlockInfo
 * @property {UInt64} safeBlock
 * @property {UInt64} latestBlock
 */

/**
 * @typedef {object} SafeLogFilter
 * @property {LogFilter} filter
 * @property {UInt64} latestBlock
 * @property {UInt64} safeBlock
 */

/**
 * @typedef {object} EstimatedLogRange
 * @property {UInt64} bySize
 * @property {UInt64} byTimespan
 * @property {UInt64} byQuantity
 */

/**
 * Contain logs and related information for a result of logs query.
 */
class LogSegment {
    /**
     * List of logs in range `[fromBlock, toBlock]`.
     *
     * @type {Array<Log>}
     */
    get logs() {
        return this._logs
    }

    /**
     * Confirm that logs is fetch from this block number.
     *
     * @type {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * Confirm that logs is fetch to this block number, inclusive.  In next
     * query, it is safe for retrieving from block number `toBlock + 1` without
     * worry about missing logs.
     *
     * @type {UInt64}
     */
    get toBlock() {
        return this._toBlock
    }

    /**
     * Latest mined block number at query node.
     *
     * @type {UInt64}
     */
    get latestBlock() {
        return this._latestBlock
    }

    /**
     * Latest and safe block number.
     *
     * @type {UInt64}
     */
    get safeBlock() {
        return this._safeBlock
    }

    /**
     * Initialize by {@link LogSegment.create}.
     *
     * @param {object} values
     * @param {Array<Log>} values.logs
     * @param {UInt64} values.fromBlock
     * @param {UInt64} values.toBlock
     * @param {UInt64} values.latestBlock
     * @param {UInt64} values.safeBlock
     */
    constructor(values) {
        this._logs = values.logs
        this._fromBlock = values.fromBlock
        this._toBlock = values.toBlock
        this._latestBlock = values.latestBlock
        this._safeBlock = values.safeBlock
    }

    /**
     *
     * @param {object} object
     * @param {Array<Log>} object.logs - List of matched logs by filter.
     * @param {UInt64} object.fromBlock - Retrieve logs from this block
     * number.
     * @param {UInt64} object.toBlock - Confirm logs correctness in
     * range `[fromBlock, toBlock]`.
     * @param {UInt64} object.latestBlock - Latest block number at served node.
     * @param {UInt64} object.safeBlock - Latest and safe block number at served
     * node.
     * @return {Result<string, LogSegment>}
     */
    static create(object) {
        let r1 = validateInstanceMap(object, [
            ['logs', Array],
            ['fromBlock', UInt64],
            ['toBlock', UInt64],
            ['latestBlock', UInt64],
            ['safeBlock', UInt64]
        ])
        if (r1.error) {
            return r1
        }
        let r2 = validateArrayItems(object.logs, Log)
        if (r2.error) {
            return Result.errro(`logs: ${r2.error}`)
        }
        let data = new LogSegment(object)
        return Result.ok(data)
    }
}

/**
 * Control quota, log range for requests to Ethereum node. Also lock queries for
 * critical errors such as bad request, bad response and overloading.
 *
 * @example
 * let valve = RequestValve.create()
 *
 * // Update state by.
 * valve.updateLogRange()
 * valve.downLogRange()
 * value.reportError()
 *
 * // Ask for performing requests to Ethereum node.
 * valve.open()
 *
 * // Retrieve estimated log range.
 * valve.logRange()
 */
class RequestValve {
    /**
     * Estimated log range from previous query result by
     * {@link RequestValve.updateLogRange}. Then, this value is consider for
     * setup log filter.
     *
     * @type {PInt64}
     */
    get logRange() {
        return PInt64.fromBigInt(this._logRange).open()
    }

    /**
     * @type {UInt64 | undefined}
     */
    get safeBlockNumber() {
        return this._safeBlockNumber
    }

    /**
     * Initialize by {@link RequestValve.create}.
     *
     * @param {object} config
     * @param {EndpointQuota} config.quota
     * @param {StdioLog} config.log
     * @param {UInt64} config.logSafeGap
     * @param {UInt64} config.rangeBoundary
     * @param {DataSize} config.logSizeBorder
     * @param {Timespan} config.logTimeBorder
     * @param {UInt64} config.logQuantityBorder
     */
    constructor(config) {
        let {
            quota: {batchLimit, batchTimespan},
            log,
            logSafeGap,
            logRangeBoundary,
            logSizeBorder,
            logTimeBorder,
            logQuantityBorder
        } = config
        this._log = log
        this._logSafeGap = logSafeGap
        this._batchLimit = batchLimit
        this._batchTimespan = batchTimespan
        this._logRangeBoundary = logRangeBoundary
        this._logSizeBorder = logSizeBorder
        this._logTimeBorder = logTimeBorder
        this._logQuantityBorder = logQuantityBorder
        this._logRange = 10n
    }

    /**
     *
     * @param {object} config
     * @param {EndpointQuota} config.quota
     * @param {StdioLog} config.log
     * @param {UInt64} [config.logSafeGap=15]
     * @param {UInt64} [config.logRangeBoundary=5,000]
     * @param {DataSize} [config.logSizeBorder=4MB]
     * @param {Timespan} [config.logTimeBorder=6s]
     * @param {UInt64} [config.logQuantityBorder=10,000]
     * @return {Result<TypeError, RequestValve>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['quota', EndpointQuota],
            ['log', StdioLog],
            ['logSafeGap', UInt64, true],
            ['logRangeBoundary', UInt64, true],
            ['logSizeBorder', DataSize, true],
            ['logTimeBorder', Timespan, true],
            ['logQuantityBorder', UInt64, true]
        ])
        if (r1.error) {
            return r1
        }
        let {
            quota, log, logSafeGap, logRangeBoundary, logSizeBorder,
            logTimeBorder, logQuantityBorder
        } = config
        logSafeGap = logSafeGap || UInt64.fromNumber(15).open()
        logRangeBoundary = logRangeBoundary || UInt64.fromNumber(5000).open()
        logSizeBorder = logSizeBorder || DataSize.fromMegabytes(4).open()
        logTimeBorder = logTimeBorder || Timespan.fromSeconds(6).open()
        logQuantityBorder = logQuantityBorder || UInt64.fromNumber(10000).open()
        let instance = new RequestValve({
            quota, log, logSafeGap, logRangeBoundary, logSizeBorder,
            logTimeBorder, logQuantityBorder
        })
        return Result.ok(instance)
    }

    /**
     * Ask for performing queries to a ETH node. Succeeded result means request
     * quota is enough and the node is not lock by reasons.
     *
     * @param {UInt} quantity - Quantities of requests will be use.
     * @param {UInt64} blockNumber - The block number that query will be
     * involve. If it is not a safe block certainly then return failed result.
     * If there is a safe block, or unable for confirmation then returned result
     * depend on rest of conditions. Give `undefined` mean skip this condition.
     * @return {Result<undefined>}
     */
    open(quantity, blockNumber = undefined) {
        this._updateInternalStat()
        let r1 = this._openTimestampLocker()
        if (r1.error) {
            return r1
        }
        let r2 = this._openForSafeBlockNumber(blockNumber)
        if (r2.error) {
            return r2
        }
        let r3 = this._openQuotaLocker(quantity)
        if (r3.error) {
            return r3
        }
        return Result.ok()
    }

    /**
     * Set the latest block number which is returned from the node. The value is
     * use to find out safe block number and evaluate locking for the requests
     * that requires greater block number.
     *
     * The safe block number can be retrieve by
     * {@link RequestValve.safeBlockNumber}.
     *
     * @param {UInt64} blockNumber
     * @throws {TypeError}
     */
    setLatestBlockNumber(blockNumber) {
        validateInstance(blockNumber, UInt64).open()
        this._latestBlockNumber = blockNumber
        if (blockNumber.lt(this._logSafeGap)) {
            this._safeBlockNumber = undefined
            return
        }
        this._safeBlockNumber = blockNumber.sub(this._logSafeGap)
        this._safeBlockNumberTo = Timestamp.now().add(SECONDS_6)
    }

    /**
     * Give back request quota after ask for consumption by
     * {@link SafeNode.open}.
     *
     * @param {UInt} quantity
     */
    giveBackQuota(quantity) {
        this._remainRequests = this._remainRequests.add(quantity)
    }

    /**
     * Evaluate errors for estimation log range and locking queries.
     *
     * @param {BadError} error
     */
    reportError(error) {
        switch (error.code) {
            case NODE_BAD_SERVER:
                this._handleBadServer(error)
                break
            case NODE_BAD_RESPONSE:
                this._handleBadResponse(error)
                break
            case NODE_OVERLOADING:
                this._handleOverloading(error)
                break
            default:
                this._log.error(error.message)
        }
    }

    /**
     * Estimate log range but will not set it greater than `_logRangeBoundary`.
     * Result can be retrieve by `logRange`.
     *
     * @param {NodeResponse<LogSegment>} logResponse
     */
    updateLogRange(logResponse) {
        let {bySize, byTimespan, byQuantity} =
            this._estimateLogRange(logResponse)
        let logRange = BigMath.min(
            bySize.value, byTimespan.value, byQuantity.value,
            this._logRangeBoundary.value
        )
        if (
            logRange > this._logRange &&
            this._lockRangeUpTo &&
            this._lockRangeUpTo.isFuture()
        ) {
            return
        }
        this._printLogResponse(logResponse)
        this._printEstimatedLogRange(bySize, byTimespan, byQuantity)
        this._logRange = logRange
        this._log.info('set log range', this._logRange)
    }

    /**
     * Decrease log range but will not set it less than `1`.
     */
    downLogRange() {
        this._logRange = BigMath.max(this._logRange / 2n, 1n)
        this._lockRangeUpTo = Timestamp.now().add(MINUTES_1)
        this._log.info('set log range', this._logRange)
    }

    /**
     * @private
     * @param {BadError} error
     */
    _handleBadServer(error) {
        this._lockTimestampFor(error, SECONDS_30)
    }

    /**
     * @private
     * @param {BadError} error
     */
    _handleBadResponse(error) {
        this._lockTimestampFor(error, SECONDS_30)
    }

    /**
     * @private
     * @param {BadError} error
     */
    _handleOverloading(error) {
        this._lockTimestampFor(error, SECONDS_15)
        this.downLogRange()
    }

    /**
     * @private
     * @param {NodeResponse<LogSegment>} logResponse
     * @return {EstimatedLogRange}
     */
    _estimateLogRange(logResponse) {
        let {
            logs,
            fromBlock: {value: fromBlock},
            toBlock: {value: toBlock}
        } = logResponse.data
        let responseSize = logResponse.size.value
        let responseTime = logResponse.time.toBigInt()
        let logQuantity = UInt64.fromNumber(logs.length).open().value
        let range = BigMath.max(toBlock - fromBlock + 1n, 1n)
        let sizePerBlock = BigMath.max(responseSize / range, 1n)
        let rangeBySize = BigMath.max(
            this._logSizeBorder.value / sizePerBlock, 1n
        )
        let quantityPerBlock = BigMath.max(logQuantity / range, 1n)
        let rangeByQuantity = this._logQuantityBorder.value / quantityPerBlock
        let timespanPerBlock = BigMath.max(responseTime / range, 1n)
        let rangeByTimespan =
            BigInt(this._logTimeBorder.value) / timespanPerBlock
        return {
            bySize: UInt64.fromBigInt(rangeBySize).open(),
            byQuantity: UInt64.fromBigInt(rangeByQuantity).open(),
            byTimespan: UInt64.fromBigInt(rangeByTimespan).open()
        }
    }

    /**
     * @private
     * @param {NodeResponse<LogSegment>} response
     */
    _printLogResponse(response) {
        this._log.info('response size', response.size.format())
        this._log.info('response time', response.time.format())
        this._log.info('response quantity', response.data.logs.length)
    }

    /**
     * @private
     * @param {UInt64} bySize
     * @param {UInt64} byTimespan
     * @param {UInt64} byQuantity
     */
    _printEstimatedLogRange(bySize, byTimespan, byQuantity) {
        this._log.info('estimated log range by size', bySize.format5())
        this._log.info('estimated log range by timespan', byTimespan.format5())
        this._log.info('estimated log range by quantity', byQuantity.format5())
    }

    /**
     * @private
     */
    _updateInternalStat() {
        this._unlockTimestamp()
        this._restoreQuota()
    }

    /**
     * @private
     * @return {undefined}
     */
    _unlockTimestamp() {
        if (this._lockTo === undefined) {
            return
        }
        if (this._lockTo.isPast()) {
            this._lockTo = undefined
        }
    }

    /**
     * @private
     */
    _restoreQuota() {
        if (
            this._nextFillRequests === undefined ||
            this._nextFillRequests.isPresentOrPast()
        ) {
            this._remainRequests = this._batchLimit
            this._nextFillRequests = Timestamp.now().add(this._batchTimespan)
        }
    }

    /**
     * @private
     * @param {BadError} error
     * @param {Timespan} timespan
     */
    _lockTimestampFor(error, timespan) {
        this._lockedByError = error
        if (this._lockTo) {
            return
        }
        this._lockTo = Timestamp.now().add(timespan)
        this._log.error(error.message)
    }

    /**
     * @private
     * @return {Result<undefined>}
     */
    _openTimestampLocker() {
        if (this._lockTo === undefined) {
            return Result.ok()
        }
        return Result.error(this._lockedByError)
    }

    /**
     * @private
     * @param {UInt64} blockNumber
     * @return {Result<TypeError, undefined>}
     */
    _openForSafeBlockNumber(blockNumber) {
        if (blockNumber === undefined) {
            return Result.ok()
        }
        if (this._latestBlockNumber === undefined) {
            return Result.ok()
        }
        if (this._safeBlockNumber === undefined) {
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        if (this._safeBlockNumberTo.isPast()) {
            return Result.ok()
        }
        if (blockNumber.lte(this._safeBlockNumber)) {
            return Result.ok()
        }
        else {
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
    }

    /**
     * @private
     * @param {UInt} quantity
     * @return {Result<undefined>}
     */
    _openQuotaLocker(quantity) {
        if (this._remainRequests.lt(quantity)) {
            return Result.badError(NODE_REQUEST_QUOTA, 'try later')
        }
        this._remainRequests = this._remainRequests.sub(quantity)
        return Result.ok()
    }
}

/**
 * Improvement of `Node` without modifications of lower layers of ETH JSON RPC.
 *
 * Firstly, it handles overloading by recognize errors and reduce number of
 * requests or even denie callings in nextime.
 *
 * Secondly, it try to avoid or at least reduce incorrect returned data from RPC
 * methods such as `eth_getLogs`.
 */
class SafeNode {
    /**
     * Host name or IP address that refers to Ethereum endpoint.
     *
     * @type {string}
     */
    get host() {
        return this._node.host
    }

    /**
     * Initialize by {@link SafeNode.create}.
     *
     * @param {object} config
     * @param {Node} config.node
     * @param {RequestValve} config.valve
     * @param {StdioLog} config.log
     */
    constructor(config) {
        let {node, valve, log} = config
        this._node = node
        this._valve = valve
        this._log = log
    }

    /**
     *
     * @param {object} config
     * @param {EthEndpoint} config.endpoint - URL and credentials for
     * connecting to a ETH node.
     * @param {StdioLog} config.log - A log layer.
     * @return {Result<TypeError, SafeNode>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['endpoint', EthEndpoint],
            ['log', StdioLog]
        ])
        if (r1.error) {
            return r1
        }
        let {endpoint, log} = config
        let {url, username, password, timeout} = endpoint
        let nodeEndpoint = HttpEndpoint.create({
            url, username, password, timeout
        }).open()
        let node = Node.create({endpoint: nodeEndpoint}).open()
        let {
            quota, logSafeGap, logRangeBoundary, logSizeBorder, logTimeBorder,
            logQuantityBorder
        } = endpoint
        let valve = RequestValve.create({
            log: log,
            quota: quota,
            logSafeGap: logSafeGap,
            logRangeBoundary: logRangeBoundary,
            logSizeBorder: logSizeBorder,
            logTimeBorder: logTimeBorder,
            logQuantityBorder: logQuantityBorder
        }).open()
        let instance = new SafeNode({node, valve, log})
        return Result.ok(instance)
    }

    /**
     * @return {Promise<Result<BadError, NodeResponse<UInt64>>>}
     */
    async getBlockNumber() {
        let r1 = this._valve.open(UINT_1)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockNumber()
        if (r2.error) {
            this._valve.reportError(r2.error)
        }
        return r2
    }

    /**
     * @param {UInt64} blockNumber
     * @return {Promise<Result<BadError, NodeResponse<Block>>>}
     */
    async getBlockByNumber(blockNumber) {
        let r1 = this._valve.open(UINT_1, blockNumber)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockByNumber(blockNumber)
        if (r2.error) {
            this._valve.reportError(r2.error)
        }
        return r2
    }

    /**
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<Transaction>>}
     */
    async getTransactionByHash(hash) {
        let r1 = this._valve.open(UINT_1)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getTransactionByHash(hash)
        if (r2.error) {
            this._valve.reportError(r2.error)
        }
        return r2
    }

    /**
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<NodeResponse<LogSegment>>>}
     */
    async getLogs(filter) {
        let r1 = this._valve.open(UINT_2, filter.toBlock)
        if (r1.error) {
            return r1
        }
        let r2 = await this._makeSafeLogFilter(filter)
        if (r2.error) {
            this._valve.giveBackQuota(UINT_1)
            this._valve.reportError(r2.error)
            return r2
        }
        let {data: {safeFilter, latestBlock, safeBlock}} = r2
        let r3 = await this._node.getLogs(safeFilter)
        if (r3.error) {
            this._valve.reportError(r3.error)
            return r3
        }
        let {data: nodeResponse} = r3
        let logSegment = LogSegment.create({
            logs: nodeResponse.data,
            fromBlock: safeFilter.fromBlock,
            toBlock: safeFilter.toBlock,
            latestBlock: latestBlock,
            safeBlock: safeBlock
        }).open()
        let data = nodeResponse.cloneWithNewData(logSegment)
        this._valve.updateLogRange(data)
        return Result.ok(data)
    }

    /**
     * Perform a calling to ETH node.
     *
     * @param {string} method - Method to be call, see
     * [ETH JSON RPC](https://eth.wiki/json-rpc/API).
     * @param {Array<any>} params - Positional arguments to pass to method.
     * @return {Promise<Result<BadError, NodeResponse>>}
     */
    async call(method, params) {
        return await this._node.call(method, params)
    }

    /**
     * Return safe block number and latest block nubmer as metadata.
     *
     * @private
     * @return {Promise<Result<BadError, SafeBlockInfo>>}
     */
    async _getSafeBlockInfo() {
        let r1 = await this._node.getBlockNumber()
        if (r1.error) {
            return r1
        }
        let {data: latestBlock} = r1.data
        this._valve.setLatestBlockNumber(latestBlock)
        if (this._valve.safeBlockNumber === undefined) {
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        let instance = {
            latestBlock: latestBlock,
            safeBlock: this._valve.safeBlockNumber.clone()
        }
        return Result.ok(instance)
    }

    /**
     * Build safe log filter, also update safe block number.
     * Returned metadata is latest block number.
     *
     * @private
     * @param {LogFilter} filter
     * @return {Promise<Result<BadError, SafeLogFilter>>}
     */
    async _makeSafeLogFilter(filter) {
        let r1 = await this._getSafeBlockInfo()
        if (r1.error) {
            return r1
        }
        let {safeBlock, latestBlock} = r1.data
        if (safeBlock.lt(filter.fromBlock)) {
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        let estimatedToBlock = filter.fromBlock
            .addPInt64(this._valve.logRange)
            .subNumber(1)
        let toBlock = UInt64.min(estimatedToBlock, filter.toBlock, safeBlock)
        let safeFilter = LogFilter.create({
            fromBlock: filter.fromBlock,
            toBlock: toBlock,
            addresses: filter.addresses,
            topics: filter.topics
        }).open()
        let data = {safeFilter, latestBlock, safeBlock}
        return Result.ok(data)
    }

}

module.exports = {
    SafeNode,
    LogSegment
}
