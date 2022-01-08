'use strict'

const {ProtocolError, Node} = require('./node')
const {
    DataError,
    NotExistedError,
    UInt,
    BigUInt,
    HttpEndpoint,
    EndpointQuota,
    Block,
    LogFilter,
    LogSegment,
    TransactionHash,
    Transaction,
    assertConfigObject
} = require('./type')

class TrackedNodeError extends Error {
    static CODE_NO_RESOURCE = 1

    static CODE_NO_SAFE_BLOCK = 2

    /**
     *
     * @param {number} code - One of constants `TrackedNodeError.CODE_*`.
     * @param {string} message
     * @param {Error} cause
     */
    constructor(code, message, cause) {
        super(message)
        this.name = 'TrackedNodeError'
        this._code = code
        this._cause = cause
    }

    /**
     * @type {number}
     */
    get code() {
        return this._code
    }

    /**
     * @type {Error}
     */
    get cause() {
        return this._cause
    }
}

/**
 * Ensure a lock for resource, base on timestamp and quantity.
 */
class ResourceLocker {
    /**
     *
     * @param {object} config
     * @param {EndpointQuota} config.quota
     */
    constructor(config) {
        assertConfigObject(config, 'config', ['quota'])
        let {quota} = config
        EndpointQuota.assertInstance(quota, 'cofig.quota')
        this._quota = quota
        this._remainQuantity = this._quota.batchLimit.value
        this._nextFillTimestamp = Date.now() + this._quota.batchTimespan.value
        this._lockToTimestamp = undefined
    }

    /**
     * Ensure resource is available and there is enough quantity. If calling
     * successfully then resource is reduce by `quantity`.
     *
     * @param {UInt} quantity - Number of request for consumption.
     * @throws {TrackedNodeError}
     */
    assertConsumption(quantity) {
        UInt.assertInstance(quantity, 'quantity')
        let now = Date.now()
        if (this._lockToTimestamp && now < this._lockToTimestamp) {
            throw new TrackedNodeError(
                TrackedNodeError.CODE_NO_RESOURCE, 'locked by timestamp'
            )
        }
        if (now >= this._nextFillTimestamp) {
            this._remainQuantity = this._quota.batchLimit.value
            this._nextFillTimestamp = Date.now() +
                this._quota.batchTimespan.value
        }
        let remain = this._remainQuantity - quantity.value
        if (remain < 0) {
            throw new TrackedNodeError(
                TrackedNodeError.CODE_NO_RESOURCE, 'out of quota'
            )
        }
        this._remainQuantity = remain
    }

    /**
     * Lock in time range [now, now + timespan]. If there is already lock then
     * override it. This call locks resource even resource quantity is
     * available.
     *
     * @param {UInt} timespan - Time period in miliseconds.
     */
    lockFor(timespan) {
        this._lockToTimestamp = Date.now() + timespan
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
class TrackedNode {
    /**
     *
     * @param {object} config
     * @param {HttpEndpoint} config.endpoint
     * @param {EndpointQuota} config.quota
     * @param {UInt} [config.timeout]
     * @param {BigUInt} [config.blockGap]
     * @throws {DataError}
     */
    constructor(config) {
        assertConfigObject(config, 'config', ['endpoint', 'timeout', 'quota'])
        let {endpoint, quota, timeout, blockGap} = config
        HttpEndpoint.assertInstance(endpoint, 'config.endpoint')
        EndpointQuota.assertInstance(quota, 'config.quota')
        timeout = timeout || new UInt(3000)
        UInt.assertInstance(timeout, 'config.timeout')
        blockGap = blockGap || new BigUInt(15)
        BigUInt.assertInstance(blockGap, 'config.blockGap')
        this._blockGap = blockGap
        this._node = new Node({endpoint, timeout})
        this._locker = new ResourceLocker({quota: quota})
    }

    /**
     * @type {BigUInt}
     */
    _blockGap

    /**
     * @type {Node}
     */
    _node

    /**
     * @type {ResourceLocker}
     */
    _locker

    /**
     * Latest block number which is update by last call such as
     * `getBlockNumber()` or `getLogs()`.
     *
     * @type {BigUInt}
     */
    _blockNumber

    /**
     * @type {UInt}
     */
    _blockNumberLockTo

    /**
     * @returns {BigUInt}
     * @throws {TrackedNodeError | ProtocolError}
     */
    async getBlockNumber() {
        this._locker.assertConsumption(1)
        try {
            this._blockNumber = await this._node.getBlockNumber()
            return this._blockNumber
        }
        catch (error) {
            this._handleNodeError(error)
        }
    }

    /**
     * @param {BigUInt} blockNumber
     * @returns {Block}
     * @throws {DataError | TrackedNodeError | NotExistedError | ProtocolError}
     */
    async getBlockByNumber(blockNumber) {
        this._locker.assertConsumption(1)
        try {
            return await this._node.getBlockByNumber(blockNumber)
        }
        catch (error) {
            this._handleNodeError(error)
        }
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Array<LogSegment>}
     * @throws {DataError | TrackedNodeError | ProtocolError}
     */
    async getLogs(filter) {
        this._locker.assertConsumption(
            new UInt(2)
        )
        this._assertBlockNumber(filter.toBlock)
        try {
            this._blockNumber = await this._node.getBlockNumber()
            let safeBlockNumber = this._blockNumber.value -
                this._blockGap.value
            if (safeBlockNumber < filter.fromBlock.value) {
                throw new TrackedNodeError(
                    TrackedNodeError.CODE_NO_SAFE_BLOCK,
                    'no safe block for log records'
                )
            }
            let toBlock = filter.toBlock.value < safeBlockNumber
                ? filter.toBlock
                : new BigUInt(safeBlockNumber)
            let safeFilter = new LogFilter({
                fromBlock: filter.fromBlock,
                toBlock: toBlock,
                addresses: filter.addresses,
                topics: filter.topics
            })
            let logs = await this._node.getLogs(safeFilter)
            return new LogSegment(logs, toBlock)
        }
        catch (error) {
            this._handleNodeError(error)
        }
    }

    /**
     *
     * @param {TransactionHash} hash
     * @returns {Transaction}
     * @throws {DataError | TrackedNodeError | NotExistedError | ProtocolError}
     */
    async getTransactionByHash(hash) {
        this._locker.assertConsumption(1)
        try {
            return await this._node.getTransactionByHash(hash)
        }
        catch (error) {
            this._handleNodeError(error)
        }
    }

    /**
     *
     * @param {BigUInt} blockNumber
     * @throws {CODE_NO_SAFE_BLOCK}
     */
    _assertBlockNumber(blockNumber) {
        return this._blockNumber >= blockNumber ||
            this._blockNumberLockTo < Date.now()
    }

    /**
     * @private
     * @param {DataError | NotExistedError | ProtocolError} error - Error which
     * is throws from `Node`.
     * @throws {DataError | NotExistedError | ProtocolError}
     */
    _handleNodeError(error) {
        if (error instanceof ProtocolError) {
            this._handleProtocolError(error)
        }
        else if (error instanceof TrackedNodeError) {
            this._handleTrackedNodeError(error)
        }
        else {
            throw error
        }
    }

    /**
     * @private
     * @param {ProtocolError} error
     * @throws {ProtocolError} - Error which must be fixed.
     */
    _handleProtocolError(error) {
        switch (error.code) {
            case ProtocolError.CODE_IMPLICIT_OVERLOAD:
                this._locker.lockFor(3000)
                throw error
            case ProtocolError.CODE_EXPLICIT_OVERLOAD:
                this._locker.lockFor(6000)
                throw error
            case ProtocolError.CODE_BAD_SERVER:
                this._locker.lockFor(60000)
                throw error
            case ProtocolError.CODE_BAD_RESPONSE:
                this._locker.lockFor(60000)
                throw error
            case ProtocolError.CODE_BAD_REQUEST:
                throw error
            default:
                throw error
        }
    }

    /**
     *
     * @param {TrackedNodeError} error
     * @throws {TrackedNodeError}
     */
    _handleTrackedNodeError(error) {
        switch (error.code) {
            case TrackedNodeError.CODE_NO_SAFE_BLOCK:
                this._lockFor(3000)
                throw error
            default:
                throw error
        }
    }

    _lockFor(miliseconds) {
        this._blockNumberLockTo = Date.now() + miliseconds
    }
}

module.exports = {
    TrackedNodeError,
    TrackedNode
}
