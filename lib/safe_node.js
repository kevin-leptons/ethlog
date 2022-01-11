'use strict'

const log = require('stdio_log')
const {Node} = require('./node')
const {
    ErrorCode,
    Result,
    UInt,
    UInt64,
    PInt64,
    Timespan,
    Endpoint,
    HttpEndpoint,
    EndpointQuota,
    Block,
    LogFilter,
    Log,
    ByteData32,
    Transaction,
    assertObjectAttributes,
    assertInstance
} = require('./type')

const UINT_ONE = new UInt(1)
const UINT_TWO = new UInt(2)
const TIMESPAN_15_SECONDS = Timespan.fromSeconds(15).open()
const TIMESPAN_6_SECONDS = Timespan.fromSeconds(6).open()
const TIMESPAN_5_MINUTES = Timespan.fromMinutes(5).open()
const TIMESPAN_1_HOUR = Timespan.fromMinutes(60).open()
/**
 * @readonly
 * @enum {number}
 */
const LogRangeValveActionKind = {
    NONE: 0,
    UP: 1,
    DOWN: 2
}
/**
 * @readonly
 * @enum {number}
 */
const LogRangeValveAction = {
    NONE: 0,
    UP_BIG: 1,
    UP_SMALL: 2,
    DOWN_BIG: 3,
    DOWN_SMALL: 4
}

/**
 *
 * @param {LogRangeValveAction} action
 * @return {boolean}
 */
function isActionKindUp(action) {
    return action === LogRangeValveAction.UP_BIG ||
        action === LogRangeValveAction.UP_SMALL
}

/**
 *
 * @param {LogRangeValveAction} action
 * @return {boolean}
 */
function isActionKindDown(action) {
    return action === LogRangeValveAction.DOWN_BIG ||
        action === LogRangeValveAction.DOWN_SMALL
}

/**
 * Keep log range `r = toBlock - fromBlock` from `getLogs()` in limits.
 * Allow to increase or decrease this range.
 */
class LogRangeValve {
    /**
     * @type {UInt64}
     */
    get value() {
        return new UInt64(this._value)
    }

    /**
     *
     * @param {object} config
     * @param {UInt64} [config.upperBoundary]
     * @param {UInt64} [config.smallChangeStep]
     * @param {UInt64} [config.bigChangeStep]
     */
    constructor(config) {
        assertObjectAttributes(config, [
            'upperBoundary', 'smallChangeStep', 'bigChangeStep'
        ])
        let {upperBoundary, smallChangeStep, bigChangeStep} = config
        upperBoundary = upperBoundary || new UInt64(5000n)
        smallChangeStep = smallChangeStep || new UInt64(2n)
        bigChangeStep = bigChangeStep || new UInt64(100n)
        assertInstance(upperBoundary, UInt64, 'upperBoundary')
        assertInstance(smallChangeStep, UInt64, 'smallChangeStep')
        assertInstance(bigChangeStep, UInt64, 'bigChangeStep')
        this._value = upperBoundary.value / 2n
        this._smallChangeValue =
            smallChangeStep.value * upperBoundary.value / 100n
        this._bigChangeValue = bigChangeStep.value * upperBoundary.value/ 100n
        this._actions = [
            LogRangeValveAction.NONE,
            LogRangeValveAction.NONE,
            LogRangeValveAction.NONE
        ]
    }

    /**
     * Increase the range but will not make it greater than `upperBoundary`.
     * Depend on situations, it can keep current range without increasing.
     *
     * @return {boolean} `true` on changes, `false` on no changes.
     */
    up() {
        let now = Date.now()
        if (
            this._lockUpActionTo !== undefined &&
            this._lockUpActionTo > now
        ) {
            log.debug(this._actions, 'locked up for stable at', this._value)
            return false
        }
        this._processNextAction(LogRangeValveActionKind.UP)
        this._applyNewValue()
        if (this._shouldLockUpAction()) {
            this._lockUpActionTo = now + TIMESPAN_5_MINUTES.value
            log.debug('lock up for stable', this._lockUpActionTo)
        }
        log.debug('up', this._value)
        return true
    }

    /**
     * Decrease range but will not make it less than `1`.
     *
     * @return {boolean} `true` on changes, `false` on no changes.
     */
    down() {
        this._processNextAction(LogRangeValveActionKind.DOWN)
        this._applyNewValue()
        log.debug('down', this._value)
        return true
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processNextAction(hint) {
        if (this._isActionNone()) {
            this._processActionNone(hint)
        }
        else if (this._isActionUpUp()) {
            this._processActionUpUp(hint)
        }
        else if (this._isActionDownDown()) {
            this._processActionDownDown(hint)
        }
        else if (this._isActionUpDown()) {
            this._processActionUpDown(hint)
        }
        else if (this._isActionDownUp()) {
            this._processActionDownUp(hint)
        }
    }

    /**
     * @return {boolean}
     */
    _isActionNone() {
        return this._actions[1] === LogRangeValveAction.NONE ||
            this._actions[2] === LogRangeValveAction.NONE
    }

    /**
     * @return {boolean}
     */
    _isActionUpUp() {
        return isActionKindUp(this._actions[1]) &&
            isActionKindUp(this._actions[2])
    }

    /**
     * @return {boolean}
     */
    _isActionDownDown() {
        return isActionKindDown(this._actions[1]) &&
            isActionKindDown(this._actions[2])
    }

    /**
     * @return {boolean}
     */
    _isActionUpDown() {
        return isActionKindUp(this._actions[1]) &&
            isActionKindDown(this._actions[2])
    }

    /**
     * @return {boolean}
     */
    _isActionDownUp() {
        return isActionKindDown(this._actions[1]) &&
            isActionKindUp(this._actions[2])
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processActionNone(hint) {
        if (hint === LogRangeValveActionKind.UP) {
            this._pushAction(LogRangeValveAction.UP_BIG)
        }
        else if (hint === LogRangeValveActionKind.DOWN) {
            this._pushAction(LogRangeValveAction.DOWN_BIG)
        }
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processActionUpUp(hint) {
        if (hint === LogRangeValveActionKind.UP) {
            this._pushAction(LogRangeValveAction.UP_BIG)
        }
        else if (hint === LogRangeValveActionKind.DOWN) {
            this._pushAction(LogRangeValveAction.DOWN_BIG)
        }
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processActionDownDown(hint) {
        if (hint === LogRangeValveActionKind.UP) {
            this._pushAction(LogRangeValveAction.UP_SMALL)
        }
        else if (hint === LogRangeValveActionKind.DOWN) {
            this._pushAction(LogRangeValveAction.DOWN_BIG)
        }
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processActionUpDown(hint) {
        if (hint === LogRangeValveActionKind.UP) {
            this._pushAction(LogRangeValveAction.UP_SMALL)
        }
        else if (hint === LogRangeValveActionKind.DOWN) {
            this._pushAction(LogRangeValveAction.DOWN_BIG)
        }
    }

    /**
     *
     * @param {LogRangeValveActionKind} hint
     */
    _processActionDownUp(hint) {
        if (hint === LogRangeValveActionKind.UP) {
            this._pushAction(LogRangeValveAction.UP_SMALL)
        }
        else if (hint === LogRangeValveActionKind.DOWN) {
            this._pushAction(LogRangeValveAction.DOWN_BIG)
        }
    }

    /**
     *
     * @param {LogRangeValveAction} action
     */
    _pushAction(action) {
        this._actions[0] = this._actions[1]
        this._actions[1] = this._actions[2]
        this._actions[2] = action
    }

    /**
     * Update `_value`.
     */
    _applyNewValue() {
        let changeStepValue = this._getChangeStepValue()
        let newValue = this._value + changeStepValue
        newValue = (newValue > this._upperBoundary)
            ? this._upperBoundary
            : newValue
        newValue = (newValue < 1)
            ? 1
            : newValue
        this._value = newValue
    }

    /**
     * @return {number}
     */
    _getChangeStepValue() {
        switch (this._actions[2]) {
            case LogRangeValveAction.UP_SMALL:
                return this._smallChangeValue
            case LogRangeValveAction.UP_BIG:
                return this._bigChangeValue
            case LogRangeValveAction.DOWN_SMALL:
                return -this._smallChangeValue
            case LogRangeValveAction.DOWN_BIG:
                return -this._bigChangeValue
        }
    }

    /**
     *
     * @return {boolean}
     */
    _shouldLockUpAction() {
        return isActionKindDown(this._actions[1]) &&
            isActionKindUp(this._actions[2])
    }
}

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
     * @param {LogRangeValve} [config.logRangeValve]
     */
    constructor(config) {
        let {quota, logRangeValve} = config
        let {batchLimit, batchTimespan} = quota
        let {value: batchLimitValue} = batchLimit
        let {value: batchTimespanValue} = batchTimespan
        this._batchLimit = batchLimitValue
        this._batchTimespan = batchTimespanValue
        this._logRangeValve = logRangeValve || new LogRangeValve()
        this._updateStat()
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
        this._updateStat()
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
        this._safeBlockNumberTo = Date.now() + TIMESPAN_6_SECONDS.value
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

    upLogRangeRequest() {
        this._logRangeValve.up()
    }

    _updateStat() {
        this._now = Date.now()
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
     *
     * @param {ErrorCode} error
     * @param {Timespan} timespan
     */
    _lockTimestampFor(error, timespan) {
        this._lockTimestampBy = error
        this._lockTimestampTo = this._now + timespan.value
    }

    /**
     *
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
     *
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
     *
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

class Metadata {
    /**
     * @type {UInt64}
     */
    get latestBlockNumber() {
        return this._latestBlockNumber
    }

    /**
     * @type {UInt64}
     */
    get confirmedBlockNumber() {
        return this._confirmedBlockNumber
    }

    /**
     * @typedef {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     *
     * @param {object} values
     * @param {UInt64} values.latestBlockNumber
     * @param {UInt64} values.confirmedBlockNumber
     * @param {UInt64} values.fromBlock
     */
    constructor(values) {
        let {latestBlockNumber, confirmedBlockNumber, fromBlock} = values
        this._latestBlockNumber = latestBlockNumber
        this._confirmedBlockNumber = confirmedBlockNumber
        this._fromBlock = fromBlock
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
     *
     * @param {object} config
     * @param {Endpoint} config.endpoint
     * @param {UInt64} [config.maxLogRange]
     * @param {UInt64} [config.logRangeSmallStep]
     * @param {UInt64} [config.logRangeBigStep]
     */
    constructor(config) {
        assertObjectAttributes(config, [
            'endpoint', 'maxLogRange', 'logRangeSmallStep',
            'logRangeBigStep'
        ])
        let {
            endpoint, maxLogRange, logRangeSmallStep,
            logRangeBigStep
        } = config
        maxLogRange = maxLogRange || new UInt64(5000n)
        logRangeSmallStep = logRangeSmallStep || new UInt64(2n)
        logRangeBigStep = logRangeBigStep || new UInt64(10n)
        assertInstance(endpoint, Endpoint, 'endpoint')
        assertInstance(maxLogRange, UInt64, 'maxLogRange')
        assertInstance(logRangeSmallStep, UInt64, 'logRangeSmallStep')
        assertInstance(logRangeBigStep, UInt64, 'logRangeBigStep')
        let {url, username, password, timeout, safeBlockGap, quota} = endpoint
        let httpEndpoint = new HttpEndpoint({url, username, password, timeout})
        this._node = new Node({endpoint: httpEndpoint})
        let logRangeValve = new LogRangeValve({
            upperBoundary: maxLogRange,
            smallChangeStep: logRangeSmallStep,
            bigChangeStep: logRangeBigStep
        })
        this._locker = new ChainLocker({
            quota: quota,
            logRangeValve: logRangeValve
        })
        this._host = url.value.host
        this._safeBlockGap = safeBlockGap
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
        let safeBlockNumber = latestBlockNumber.value - this._safeBlockGap.value
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
        let r2 = await this._getSafeBlockNumber()
        if (r2.error) {
            this._locker.returnQuota(UINT_ONE)
            this._locker.updateSafeBlockNumber(undefined)
            return this._evaluateNodeResult(r2)
        }
        let {data: safeBlockNumber, metadata: latestBlockNumber} = r2
        this._locker.updateSafeBlockNumber(safeBlockNumber)
        let r3 = this._getSafeLogFilter(filter, safeBlockNumber)
        if (r3.error) {
            return r3
        }
        let {data: safeFilter} = r3
        let r4 = await this._node.getLogs(safeFilter)
        if (r4.error) {
            return this._evaluateNodeResult(r4)
        }
        let {data: logs} = r4
        let filterRange = filter.toBlock.value - filter.fromBlock.value + 1n
        if (filterRange > this._locker.logRange.value) {
            this._locker.upLogRangeRequest()
        }
        let metadata = new Metadata({
            latestBlockNumber: latestBlockNumber,
            confirmedBlockNumber: safeFilter.toBlock,
            fromBlock: safeFilter.fromBlock
        })
        return Result.ok(logs, metadata)
    }

    /**
     * Return safe block number and latest block nubmer as metadata.
     *
     * @return {Promise<Result<UInt64, UInt64>>}
     */
    async _getSafeBlockNumber() {
        let r1 = await this._node.getBlockNumber()
        if (r1.error) {
            return r1
        }
        let {data: blockNumber} = r1
        let safeBlockNumber = blockNumber.value - this._safeBlockGap.value
        if (safeBlockNumber < 0n) {
            return Result.error(ErrorCode.NODE_UNSAFE_BLOCK)
        }
        let data = new UInt64(safeBlockNumber)
        return Result.ok(data, blockNumber)
    }

    /**
     *
     * @param {LogFilter} filter
     * @param {UInt64} safeBlockNumber
     * @return {Result<LogFilter>}
     */
    _getSafeLogFilter(filter, safeBlockNumber) {
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
        return Result.ok(data)
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
