'use strict'

const {Log: StdioLog} = require('stdio_log')
const {Node} = require('./node')
const {
    ErrorCode,
    ResultError,
    Result,
    UInt,
    UInt64,
    PInt64,
    Timespan,
    Timestamp,
    DataSize,
    Endpoint,
    HttpEndpoint,
    EndpointQuota,
    Block,
    LogFilter,
    Log,
    ByteData32,
    Transaction,
    BigMath,
    assertObjectAttributes,
    assertInstance,
    assertInput
} = require('./type')

const UINT_ONE = new UInt(1)
const UINT_TWO = new UInt(2)
const TIMESPAN_15_SECONDS = Timespan.fromSeconds(15n).open()
const TIMESPAN_5_MINUTES = Timespan.fromMinutes(5n).open()
const TIMESPAN_1_HOUR = Timespan.fromMinutes(60n).open()

class Metadata {
    /**
     *
     * @type {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * @type {UInt64}
     */
    get confirmedBlockNumber() {
        return this._confirmedBlockNumber
    }

    /**
     * @type {UInt64}
     */
    get latestBlockNumber() {
        return this._latestBlockNumber
    }

    /**
     * @type {DataSize}
     */
    get responseSize() {
        return this._responseSize
    }

    /**
     * @type {Timespan}
     */
    get responseTime() {
        return this._responseTime
    }

    /**
     * @type {UInt64}
     */
    get logQuantity() {
        return this._logQuantity
    }

    /**
     * @param {object} values
     * @param {UInt64} values.fromBlock
     * @param {Timespan} values.responseTime
     * @param {UInt64} values.confirmedBlockNumber
     * @param {UInt64} values.latestBlockNumber
     * @param {DataSize} values.responseSize
     * @param {UInt64} values.logQuantity
     */
    constructor(values) {
        assertObjectAttributes(values, [
            'fromBlock', 'responseTime', 'confirmedBlockNumber',
            'latestBlockNumber', 'responseSize', 'logQuantity'
        ])
        let {
            fromBlock, responseTime, confirmedBlockNumber,
            latestBlockNumber, responseSize, logQuantity
        } = values
        assertInstance(fromBlock, UInt64, 'fromBlock')
        assertInstance(responseTime, Timespan, 'responseTime')
        assertInstance(confirmedBlockNumber, UInt64, 'confirmedBlockNumber')
        assertInstance(latestBlockNumber, UInt64, 'latestBlockNumber')
        assertInstance(responseSize, DataSize, 'dataSize')
        assertInstance(logQuantity, UInt64, 'logQuantity')
        this._fromBlock = fromBlock
        this._responseTime = responseTime
        this._confirmedBlockNumber = confirmedBlockNumber
        this._latestBlockNumber = latestBlockNumber
        this._responseSize = responseSize
        this._logQuantity = logQuantity
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
        return new UInt64(this._value)
    }

    /**
     *
     * @param {object} config
     * @param {StdioLog} config.log
     * @param {UInt64} [config.rangeBoundary]
     * @param {DataSize} [config.sizeBorder]
     * @param {Timespan} [config.timeBorder]
     * @param {UInt64} [config.quantityBorder]
     */
    constructor(config) {
        assertInput(config, [
            ['log', StdioLog],
            ['rangeBoundary', UInt64, 'rangeBoundary', true],
            ['sizeBorder', DataSize, 'sizeBorder', true],
            ['timeBorder', Timespan, 'timeBorder', true],
            ['quantityBorder', UInt64, 'quantityBorder', true]
        ])
        let {
            log, rangeBoundary, sizeBorder, timeBorder, quantityBorder
        } = config
        this._log = log
        this._rangeBoundary = rangeBoundary ? rangeBoundary.value : 5000n
        this._sizeBorder = sizeBorder ? sizeBorder.value : 0x100000n
        this._timeBorder = timeBorder ? timeBorder.value : 8000n
        this._quantityBorder = quantityBorder ? quantityBorder.value : 10000n
        this._value = 10n
    }

    /**
     * Increase the range but will not make it greater than `upperBoundary`.
     * Depend on situations, it can keep current range without increasing.
     *
     * @param {Metadata} metadata
     */
    up(metadata) {
        let {
            fromBlock: {value: fromBlock},
            confirmedBlockNumber: {value: toBlock},
            responseSize: {value: responseSize},
            logQuantity: {value: logQuantity},
            responseTime: {value: responseTime}
        } = metadata
        let range = BigMath.max(toBlock - fromBlock + 1n, 1n)
        let sizePerBlock = BigMath.max(responseSize / range, 1n)
        let rangeBySize = BigMath.max(
            this._sizeBorder / sizePerBlock, 1n
        )
        let quantityPerBlock = BigMath.max(logQuantity / range, 1n)
        let rangeByQuantity = this._quantityBorder / quantityPerBlock
        let timespanPerBlock = BigMath.max(responseTime / range, 1n)
        let rangeByTimespan = this._timeBorder / timespanPerBlock
        this._value = BigMath.min(
            rangeBySize, rangeByQuantity, rangeByTimespan, this._rangeBoundary
        )
        this._log.info('response size',
            (new DataSize(responseSize)).toHumanString())
        this._log.info('response time',
            (new Timespan(responseTime)).toHumanString())
        this._log.info('estimate by size', rangeBySize)
        this._log.info('estimate by quantity', rangeByQuantity)
        this._log.info('estimate by time', rangeByTimespan)
        this._log.info('set range:', this._value)
    }

    /**
     * Decrease range but will not make it less than `1`.
     */
    down() {
        this._value = BigMath.max(50n * this._value / 10n, 1n)
        this._log.debug('down range:', this._value)
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
            BigInt(this._logRangeValve.value.value)
        )
    }

    /**
     *
     * @param {object} config
     * @param {EndpointQuota} config.quota
     * @param {LogRangeValve} config.logRangeValve
     * @param {StdioLog} config.log
     * @throws {ResultError}
     */
    constructor(config) {
        assertInput(config, [
            ['quota', EndpointQuota],
            ['logRangeValve', LogRangeValve],
            ['log', StdioLog]
        ])
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
     * @param {UInt64 | undefined} blockNumber
     */
    updateSafeBlockNumber(blockNumber) {
        this._safeBlockNumber = blockNumber
        this._safeBlockNumberTo = Timestamp.now().value + 6000n
    }

    /**
     *
     * @param {UInt} quantity
     */
    returnQuota(quantity) {
        this._remainRequests += quantity.value
    }

    handleBadServer() {
        this._lockTimestampFor(ErrorCode.NODE_BAD_SERVER_LOCK, TIMESPAN_1_HOUR)
    }

    handleBadResponse() {
        this._lockTimestampFor(
            ErrorCode.NODE_BAD_RESPONSE_LOCK, TIMESPAN_5_MINUTES
        )
    }

    handleImplicitOverloading() {
        this._lockTimestampFor(
            ErrorCode.NODE_IMPLICIT_OVERLOADING_LOCK, TIMESPAN_15_SECONDS
        )
        this._logRangeValve.down()
    }

    handleExplicitOverloading() {
        this._lockTimestampFor(
            ErrorCode.NODE_EXPLICIT_OVERLOADING_LOCK, TIMESPAN_5_MINUTES
        )
        this._logRangeValve.down()
    }

    /**
     *
     * @param {Metadata} metadata
     */
    updateStat(metadata) {
        this._logRangeValve.up(metadata)
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
     * @param {ErrorCode} error
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
        return Result.error(ErrorCode.NODE_UNSAFE_BLOCK)
    }

    /**
     * @private
     * @param {UInt} quantity
     * @return {Result<undefined>}
     */
    _openQuotaLocker(quantity) {
        let remain = this._remainRequests - quantity.value
        if (remain < 0) {
            return Result.error(ErrorCode.NODE_REQUEST_QUOTA)
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
     * @param {object} config
     * @param {Endpoint} config.endpoint - URL and credentials for connecting
     * to a ETH node.
     * @param {StdioLog} config.log
     */
    constructor(config) {
        assertInput(config, [
            ['endpoint', Endpoint],
            ['log', StdioLog]
        ])
        let {endpoint, log} = config
        let {url, username, password, timeout} = endpoint
        this._node = new Node({
            endpoint: new HttpEndpoint({url, username, password, timeout})
        })
        this._log = log
        this._host = url.value.host
        let {
            quota, logSafeGap, logRangeBoundary, logSizeBorder, logTimeBorder,
            logQuantityBorder
        } = endpoint
        this._logSafeGap = logSafeGap
        this._locker = new ChainLocker({
            log: this._log,
            quota: quota,
            logRangeValve: new LogRangeValve({
                log: this._log,
                rangeBoundary: logRangeBoundary,
                sizeBorder: logSizeBorder,
                timeBorder: logTimeBorder,
                quantityBorder: logQuantityBorder
            })
        })
    }

    /**
     * @return {Promise<Result<UInt64, undefined>>}
     */
    async getBlockNumber() {
        let r1 = this._locker.open(UINT_ONE)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockNumber()
        if (r2.error) {
            return this._evaluateNodeResult(r2)
        }
        let {data: blockNumber} = r2
        return Result.ok(blockNumber)
    }

    /**
     * @param {UInt64} blockNumber
     * @return {Promise<Result<Block, Metadata>>}
     */
    async getBlockByNumber(blockNumber) {
        let r1 = this._locker.open(UINT_TWO, blockNumber)
        if (r1.error) {
            return r1
        }
        let r2 = await this._node.getBlockNumber()
        if (r2.error) {
            this._locker.returnQuota(UINT_ONE)
            return this._evaluateNodeResult(r2)
        }
        let {data: latestBlockNumber} = r2
        let safeBlockNumber = latestBlockNumber.value - this._logSafeGap.value
        if (safeBlockNumber >= 0) {
            this._locker.updateSafeBlockNumber(
                new UInt64(safeBlockNumber)
            )
        }
        if (safeBlockNumber < blockNumber.value) {
            this._locker.returnQuota(UINT_ONE)
            return Result.error(ErrorCode.NODE_UNSAFE_BLOCK)
        }
        let r3 = await this._node.getBlockByNumber(blockNumber)
        if (r3.error) {
            return this._evaluateNodeResult(r3)
        }
        let {data: block} = r3
        let metadata = new Metadata({
            latestBlockNumber: latestBlockNumber,
            confirmedBlockNumber: blockNumber
        })
        return Result.ok(block, metadata)
    }

    /**
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<Transaction>>}
     */
    async getTransactionByHash(hash) {
        let r1 = this._locker.open(UINT_ONE)
        if (r1.error) {
            return this._evaluateNodeResult(r1)
        }
        let r2 = await this._node.getTransactionByHash(hash)
        if (r2.error) {
            return this._evaluateNodeResult(r2)
        }
        let {data: transaction} = r2
        return Result.ok(transaction)
    }

    /**
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<Array<Log>, Metadata>>}
     */
    async getLogs(filter) {
        let r1 = this._locker.open(UINT_TWO, filter.toBlock)
        if (r1.error) {
            return r1
        }
        let r2 = await this._getSafeLogFilter(filter)
        if (r2.error) {
            this._locker.returnQuota(UINT_ONE)
            return this._evaluateNodeResult(r2)
        }
        let {data: safeFilter, metadata: latestBlockNumber} = r2
        let r3 = await this._node.getLogs(safeFilter)
        if (r3.error) {
            return this._evaluateNodeResult(r3)
        }
        let {data: logs, metadata: nodeMetadata} = r3
        let metadata = new Metadata({
            fromBlock: safeFilter.fromBlock,
            responseTime: nodeMetadata.responseTime,
            confirmedBlockNumber: safeFilter.toBlock,
            latestBlockNumber: latestBlockNumber,
            responseSize: nodeMetadata.responseSize,
            logQuantity: UInt64.fromNumber(logs.length).open()
        })
        this._locker.updateStat(metadata)
        return Result.ok(logs, metadata)
    }

    /**
     * Return safe block number and latest block nubmer as metadata.
     *
     * @private
     * @return {Promise<Result<UInt64, UInt64>>}
     */
    async _getSafeBlockNumber() {
        let r1 = await this._node.getBlockNumber()
        if (r1.error) {
            return r1
        }
        let {data: blockNumber} = r1
        let safeBlockNumber = blockNumber.value - this._logSafeGap.value
        if (safeBlockNumber < 0n) {
            return Result.error(ErrorCode.NODE_UNSAFE_BLOCK)
        }
        let data = new UInt64(safeBlockNumber)
        return Result.ok(data, blockNumber)
    }

    /**
     * Build safe log filter, also update safe block number.
     * Returned metadata is latest block number.
     *
     * @private
     * @param {LogFilter} filter
     * @return {Promise<Result<LogFilter, UInt64>>}
     */
    async _getSafeLogFilter(filter) {
        let r1 = await this._getSafeBlockNumber()
        if (r1.error) {
            this._locker.updateSafeBlockNumber(undefined)
            return r1
        }
        let {data: safeBlockNumber, metadata: latestBlockNumber} = r1
        this._locker.updateSafeBlockNumber(safeBlockNumber)
        if (safeBlockNumber.value < filter.fromBlock.value) {
            return Result.error(ErrorCode.NODE_UNSAFE_BLOCK)
        }
        let toBlock = filter.fromBlock.value + this._locker.logRange.value - 1n
        if (filter.toBlock.value < toBlock) {
            toBlock = filter.toBlock.value
        }
        if (safeBlockNumber.value < toBlock) {
            toBlock = safeBlockNumber.value
        }
        let data = new LogFilter({
            fromBlock: filter.fromBlock,
            toBlock: new UInt64(toBlock),
            addresses: filter.addresses,
            topics: filter.topics
        })
        return Result.ok(data, latestBlockNumber)
    }

    /**
     * @private
     * @param {Result} result
     * @return {Result}
     */
    _evaluateNodeResult(result) {
        switch (result.error) {
            case ErrorCode.ETH_BAD_SERVER:
                this._locker.handleBadServer()
                return result
            case ErrorCode.ETH_BAD_RESPONSE:
                this._locker.handleBadResponse()
                return result
            case ErrorCode.ETH_IMPLICIT_OVERLOADING:
                this._locker.handleImplicitOverloading()
                return result
            case ErrorCode.ETH_EXPLICIT_OVERLOADING:
                this._locker.handleExplicitOverloading()
                return result
            default:
                return result
        }
    }
}

module.exports = {
    SafeNode,
    Metadata
}
