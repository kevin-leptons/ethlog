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
    validateArrayItems
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

const UINT_ONE = UInt.fromNumber(1).open()
const UINT_TWO = UInt.fromNumber(2).open()
const TIMESPAN_15_SECONDS = Timespan.fromSeconds(15).open()
const TIMESPAN_5_MINUTES = Timespan.fromMinutes(5).open()
const TIMESPAN_1_HOUR = Timespan.fromMinutes(60).open()

/**
 * @typedef {object} SafeBlockInfo
 * @property {UInt64} safeBlock
 * @property {UInt64} latestBlock
 */

/**
 * @typedef {object} SafeLogFilter
 * @property {LogFilter} filter
 * @property {UInt64} latestBlock
 */

class LogSegment {
    /**
     * @type {Array<Log>}
     */
    get logs() {
        return this._logs
    }

    /**
     * @type {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * @type {UInt64}
     */
    get toBlock() {
        return this._toBlock
    }

    /**
     * @type {UInt64}
     */
    get latestBlock() {
        return this._latestBlock
    }

    /**
     *
     * @param {object} values
     */
    constructor(values) {
        this._logs = values.logs
        this._fromBlock = values.fromBlock
        this._toBlock = values.toBlock
        this._latestBlock = values.latestBlock
    }

    /**
     *
     * @param {object} object
     * @param {Array<Log>} object.logs - List of matched logs by filter.
     * @param {UInt64} object.fromBlock - Retrieve logs from this block
     * number.
     * @param {UInt64} object.toBlock - Confirm logs correctness in
     * range `[fromBlock, toBlock]`.
     * @param {UInt64} object.latestBlock - Latest block at served node.
     * @return {Result<string, LogSegment>}
     */
    static create(object) {
        let r1 = validateInstanceMap(object, [
            ['logs', Array],
            ['fromBlock', UInt64],
            ['toBlock', UInt64],
            ['latestBlock', UInt64]
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
 * Keep log range `r = toBlock - fromBlock` from `getLogs()` in limits.
 * Allow to increase or decrease this range.
 *
 * @private
 */
class LogRangeValve {
    /**
     * Greatest request range which is allowed.
     *
     * @type {UInt64}
     */
    get value() {
        return this._value
    }

    /**
     * Consider using {@link LogRangeValve.create} for initialization.
     *
     * @param {object} config
     */
    constructor(config) {
        let {
            log, rangeBoundary, sizeBorder, timeBorder, quantityBorder
        } = config
        this._log = log
        this._rangeBoundary = rangeBoundary.value
        this._sizeBorder = sizeBorder.value
        this._timeBorder = timeBorder.toBigInt()
        this._quantityBorder = quantityBorder.value
        this._value = 10n
    }

    /**
     * Increase the range but will not make it greater than `upperBoundary`.
     * Depend on situations, it can keep current range without increasing.
     *
     * @param {NodeResponse<LogSegment>} nodeResponse
     */
    up(nodeResponse) {
        let {
            logs,
            fromBlock: {value: fromBlock},
            toBlock: {value: toBlock}
        } = nodeResponse.data
        let responseSize = nodeResponse.size.value
        let responseTime = nodeResponse.time.toBigInt()
        let logQuantity = UInt64.fromNumber(logs.length).open().value
        let range = BigMath.max(toBlock - fromBlock + 1n, 1n)
        let sizePerBlock = BigMath.max(responseSize / range, 1n)
        let rangeBySize = BigMath.max(
            this._sizeBorder / sizePerBlock, 1n
        )
        let quantityPerBlock = BigMath.max(logQuantity / range, 1n)
        let rangeByQuantity = this._quantityBorder / quantityPerBlock
        let timespanPerBlock = BigMath.max(responseTime / range, 1n)
        let rangeByTimespan = this._timeBorder / timespanPerBlock
        let newValue = BigMath.min(
            rangeBySize, rangeByQuantity, rangeByTimespan, this._rangeBoundary
        )
        if (this._lockSetRangeTo > Timestamp.now() && newValue > this._value) {
            return
        }
        this._showLogResponse(nodeResponse)
        this._showEstimatedRange(rangeBySize, rangeByTimespan, rangeByQuantity)
        this._value = newValue
        this._log.info('set range', this._value)
    }

    /**
     * Decrease range but will not make it less than `1`.
     */
    down() {
        this._log.debug('current', this._value)
        this._value = BigMath.max(this._value / 2n, 1n)
        this._lockSetRangeTo = Date.now() - Timespan.fromMinutes(1).open()
        this._log.debug('down range:', this._value)
    }

    /**
     *
     * @param {object} config
     * @param {StdioLog} config.log
     * @param {UInt64} [config.rangeBoundary]
     * @param {DataSize} [config.sizeBorder]
     * @param {Timespan} [config.timeBorder]
     * @param {UInt64} [config.quantityBorder]
     * @return {Result<TypeError, LogRangeValve>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['log', StdioLog],
            ['rangeBoundary', UInt64, 'rangeBoundary', true],
            ['sizeBorder', DataSize, 'sizeBorder', true],
            ['timeBorder', Timespan, 'timeBorder', true],
            ['quantityBorder', UInt64, 'quantityBorder', true]
        ])
        if (r1.error) {
            return r1
        }
        let data = new LogRangeValve({
            log: config.log,
            rangeBoundary: config.rangeBoundary ||
                UInt64.fromNumber(5000).open(),
            sizeBorder: config.sizeBorder ||
                DataSize.fromMegabytes(4).open(),
            timeBorder: config.timeBorder || Timespan.fromSeconds(8).open(),
            quantityBorder: config.quantityBorder ||
                UInt64.fromNumber(10000).open()
        })
        return Result.ok(data)
    }

    /**
     *
     * @param {NodeResponse<LogSegment>} nodeResponse
     */
    _showLogResponse(nodeResponse) {
        this._log.info('response size', nodeResponse.size.format())
        this._log.info('response time', nodeResponse.time.format())
        this._log.info('response quantity', nodeResponse.data.logs.length)
    }

    /**
     *
     * @param {UInt64} bySize
     * @param {UInt64} byTimespan
     * @param {UInt64} byQuantity
     */
    _showEstimatedRange(bySize, byTimespan, byQuantity) {
        this._log.info('estimated range by size', bySize)
        this._log.info('estimated range by timespan', byTimespan)
        this._log.info('estimated range by quantity', byQuantity)
    }
}

/**
 * @private
 */
class ChainLocker {
    /**
     * @type {PInt64}
     */
    get logRange() {
        return new PInt64(
            BigInt(this._logRangeValve.value)
        )
    }

    /**
     * Consider using {@link ChainLocker.create} for initialization.
     *
     * @param {object} config
     */
    constructor(config) {
        let {
            logRangeValve,
            log,
            quota: {batchLimit, batchTimespan}
        } = config
        this._logRangeValve = logRangeValve
        this._log = log
        this._batchLimit = batchLimit.value
        this._batchTimespan = batchTimespan.value
        this._updateInternalStat()
    }

    /**
     * Ensure resource is available and there is enough quantity. If calling
     * successfully then resource is reduce by `quantity`.
     *
     * @param {UInt} quantity - Number of request for consumption.
     * @param {UInt64} blockNumber - Require safe block number for accessing.
     * @return {Result<undefined>}
     */
    open(quantity, blockNumber) {
        this._updateInternalStat()
        let r1 = this._openTimestampLocker()
        if (r1.error) {
            return r1
        }
        let r2 = this._openSafeBlockNumer(blockNumber)
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
     *
     * @param {UInt64 | undefined} blockNumber - Set `undefined` mean there is
     * no clue for confirmation safe block, so `_openSafeBlockNumer()` is
     * always succeeded.
     */
    updateSafeBlockNumber(blockNumber) {
        this._safeBlockNumber = blockNumber
        this._safeBlockNumberTo = Timestamp.now().value +
            Timespan.fromSeconds(6000).open()
    }

    /**
     *
     * @param {UInt} quantity
     */
    giveBackQuota(quantity) {
        this._remainRequests += quantity.value
    }

    /**
     *
     * @param {BadError} error
     */
    handleBadServer(error) {
        this._lockTimestampFor(error, TIMESPAN_1_HOUR)
    }

    /**
     *
     * @param {BadError} error
     */
    handleBadResponse(error) {
        this._lockTimestampFor(error, TIMESPAN_5_MINUTES)
    }

    /**
     * @param {BadError} error
     */
    handlerOverloading(error) {
        this._lockTimestampFor(error, TIMESPAN_15_SECONDS)
        this._logRangeValve.down()
    }

    /**
     *
     * @param {NodeResponse<LogSegment>} nodeResponse
     */
    updateStat(nodeResponse) {
        this._logRangeValve.up(nodeResponse)
    }

    /**
     *
     * @param {object} config
     * @param {EndpointQuota} config.quota
     * @param {LogRangeValve} config.logRangeValve
     * @param {StdioLog} config.log
     * @return {Result<TypeError, ChainLocker>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['quota', EndpointQuota],
            ['logRangeValve', LogRangeValve],
            ['log', StdioLog]
        ])
        if (r1.error) {
            return r1
        }
        let data = new ChainLocker(config)
        return Result.ok(data)
    }

    /**
     * @private
     */
    _updateInternalStat() {
        this._now = Timestamp.now().value
        if (this._lockToTimestamp === undefined) {
            this._lockToTimestamp = this._now
        }
        if (this._now > this._lockToTimestamp) {
            this._lockToTimestamp = undefined
        }
        if (
            this._nextFillRequests === undefined ||
            this._now >= this._nextFillRequests
        ) {
            this._remainRequests = this._batchLimit
            this._nextFillRequests = this._now + this._batchTimespan
        }
    }

    /**
     * @private
     * @param {BadError} error
     * @param {Timespan} timespan
     */
    _lockTimestampFor(error, timespan) {
        this._lockTimestampBy = error
        this._lockTimestampTo = this._now + timespan.value
    }

    /**
     * @private
     * @return {Result<undefined>}
     */
    _openTimestampLocker() {
        if (
            this._lockTimestampTo === undefined ||
            this._lockTimestampTo <= this._now
        ) {
            return Result.ok()
        }
        return Result.error(this._lockTimestampBy)
    }

    /**
     * @private
     * @param {UInt64} blockNumber
     * @return {Result<undefined, undefined>}
     */
    _openSafeBlockNumer(blockNumber) {
        if (blockNumber === undefined) {
            return Result.ok()
        }
        if (
            (this._safeBlockNumberTo === undefined) ||
            (this._safeBlockNumberTo < Date.now())
        ) {
            return Result.ok()
        }
        if (
            (this._safeBlockNumber === undefined) ||
            (this._safeBlockNumber.value > blockNumber.value)
        ) {
            return Result.ok()
        }
        return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
    }

    /**
     * @private
     * @param {UInt} quantity
     * @return {Result<undefined>}
     */
    _openQuotaLocker(quantity) {
        let remain = this._remainRequests - quantity.value
        if (remain < 0) {
            return Result.badError(NODE_REQUEST_QUOTA, 'try later')
        }
        this._remainRequests = remain
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
     * @type {string}
     */
    get host() {
        return this._host
    }

    /**
     * Consider using {@link SafeNode.create} for initialization.
     *
     * @param {object} config
     */
    constructor(config) {
        let {endpoint, log} = config
        let {url, username, password, timeout} = endpoint
        this._node = Node.create({
            endpoint: HttpEndpoint.create({
                url, username, password, timeout
            }).open()
        }).open()
        this._log = log
        this._host = url.value.host
        let {
            quota, logSafeGap, logRangeBoundary, logSizeBorder, logTimeBorder,
            logQuantityBorder
        } = endpoint
        this._logSafeGap = logSafeGap
        this._locker = ChainLocker.create({
            log: this._log,
            quota: quota,
            logRangeValve: LogRangeValve.create({
                log: this._log,
                rangeBoundary: logRangeBoundary,
                sizeBorder: logSizeBorder,
                timeBorder: logTimeBorder,
                quantityBorder: logQuantityBorder
            }).open()
        }).open()
    }

    /**
     * @return {Promise<Result<BadError, NodeResponse<UInt64>>>}
     */
    async getBlockNumber() {
        let r1 = this._locker.open(UINT_ONE)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockNumber()
        if (r2.error) {
            this._handleNodeError(r2.error)
            return r2
        }
        return r2
    }

    /**
     * @param {UInt64} blockNumber
     * @return {Promise<Result<BadError, NodeResponse<Block>>>}
     */
    async getBlockByNumber(blockNumber) {
        let r1 = this._locker.open(UINT_TWO, blockNumber)
        if (r1.error) {
            return r1
        }
        let r2 = await this._getSafeBlockInfo()
        if (r2.error) {
            this._locker.giveBackQuota(UINT_ONE)
            this._handleNodeError(r2.error)
            return r2
        }
        let {safeBlock} = r2.data
        if (safeBlock.lt(blockNumber)) {
            this._locker.giveBackQuota(UINT_ONE)
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        let r3 = await this._node.getBlockByNumber(blockNumber)
        if (r3.error) {
            this._handleNodeError(r3.error)
            return r3
        }
        return r3
    }

    /**
     *
     * @param {UInt64} blockNumber
     * @return {Promise<Result<Block, undefined>>}
     */
    async getBlockByNumberUnsafe(blockNumber) {
        let r1 = this._locker.open(UINT_TWO, blockNumber)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockByNumber(blockNumber)
        if (r2.error) {
            this._handleNodeError(r2.error)
            return r2
        }
        let {data: block} = r2
        return Result.ok(block)
    }

    /**
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<Transaction>>}
     */
    async getTransactionByHash(hash) {
        let r1 = this._locker.open(UINT_ONE)
        if (r1.error) {
            this._handleNodeError(r1.error)
            return r1
        }
        let r2 = await this._node.getTransactionByHash(hash)
        if (r2.error) {
            this._handleNodeError(r2.error)
            return r2
        }
        let {data: transaction} = r2
        return Result.ok(transaction)
    }

    /**
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<NodeResponse<LogSegment>>>}
     */
    async getLogs(filter) {
        let r1 = this._locker.open(UINT_TWO, filter.toBlock)
        if (r1.error) {
            return r1
        }
        let r2 = await this._makeSafeLogFilter(filter)
        if (r2.error) {
            this._locker.giveBackQuota(UINT_ONE)
            this._handleNodeError(r2.error)
            return r2
        }
        let {data: {safeFilter, latestBlock}} = r2
        let r3 = await this._node.getLogs(safeFilter)
        if (r3.error) {
            this._handleNodeError(r3.error)
            return r3
        }
        let {data: nodeResponse} = r3
        let logSegment = LogSegment.create({
            logs: nodeResponse.data,
            fromBlock: safeFilter.fromBlock,
            toBlock: safeFilter.toBlock,
            latestBlock: latestBlock
        }).open()
        let data = NodeResponse.create({
            data: logSegment,
            time: nodeResponse.time,
            size: nodeResponse.size
        }).open()
        this._locker.updateStat(data)
        return Result.ok(data)
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
        let safeBlockNumber = latestBlock.value - this._logSafeGap.value
        if (safeBlockNumber < 0n) {
            this._locker.updateSafeBlockNumber(undefined)
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        let safeBlock = UInt64.fromBigInt(safeBlockNumber).open()
        let data = {safeBlock, latestBlock}
        this._locker.updateSafeBlockNumber(safeBlock)
        return Result.ok(data)
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
        if (safeBlock.value < filter.fromBlock.value) {
            return Result.badError(NODE_UNSAFE_BLOCK, 'try later')
        }
        let toBlock = filter.fromBlock.value + this._locker.logRange.value - 1n
        if (filter.toBlock.value < toBlock) {
            toBlock = filter.toBlock.value
        }
        if (safeBlock.value < toBlock) {
            toBlock = safeBlock.value
        }
        let safeFilter = LogFilter.create({
            fromBlock: filter.fromBlock,
            toBlock: UInt64.fromBigInt(toBlock).open(),
            addresses: filter.addresses,
            topics: filter.topics
        }).open()
        let data = {safeFilter, latestBlock}
        return Result.ok(data)
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
        let data = new SafeNode(config)
        return Result.ok(data)
    }

    /**
     * @private
     * @param {BadError} error
     * @throws {BadError}
     */
    _handleNodeError(error) {
        switch (error.code) {
            case NODE_BAD_SERVER:
                this._locker.handleBadServer(error)
                break
            case NODE_BAD_RESPONSE:
                this._locker.handleBadResponse(error)
                break
            case NODE_OVERLOADING:
                this._locker.handlerOverloading(error)
                break
            default:
                throw error
        }
    }
}

module.exports = {
    SafeNode,
    LogSegment
}
