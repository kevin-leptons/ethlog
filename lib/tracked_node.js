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
    Log,
    LogSegment,
    TransactionHash,
    Transaction,
    assertConfigObject
} = require('./type')

class NoResourceError extends Error {
    constructor(message) {
        super(message)
        this.name = message
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
     * @throws {NoResourceError}
     */
    assertConsumption(quantity) {
        UInt.assertInstance(quantity, 'quantity')
        let now = Date.now()
        if (this._lockToTimestamp && now < this._lockToTimestamp) {
            throw new NoResourceError('locked by timestamp')
        }
        if (now >= this._nextFillTimestamp) {
            this._remainQuantity = this._quota.batchLimit.value
            this._nextFillTimestamp = Date.now() +
                this._quota.batchTimespan.value
        }
        let remain = this._remainQuantity - quantity.value
        if (remain < 0) {
            throw new NoResourceError('no quota')
        }
        this._remainQuantity = remain
    }

    /**
     * Lock in time range [now, now + timespan]. If there is already lock then
     * override it. This call locks resource even resource quantity is available.
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
     * @type {boolean}
     */
    get isAvailable() {}

    /**
     * @returns {BigUInt}
     * @throws {NoResourceError | ProtocolError}
     */
    async getBlockNumber() {
        this._locker.assertConsumption(1)
        try {
            return await this._node.getBlockNumber()
        }
        catch (error) {
            this._handleNodeError(error)
        }
    }

    /**
     * @param {BigUInt} blockNumber
     * @returns {Block}
     * @throws {DataError | NoResourceError | NotExistedError | ProtocolError}
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
     * @throws {DataError | NoResourceError | ProtocolError}
     */
    async getLogs(filter) {
        this._locker.assertConsumption(
            new UInt(2)
        )
        try {
            let blockNumber = await this._node.getBlockNumber()
            let safeBlockNumber = blockNumber.value - this._blockGap.value
            if (safeBlockNumber < filter.fromBlock.value) {
                this._locker.lockFor(30000)
                return
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
     * @throws {DataError | NoResourceError | NotExistedError | ProtocolError}
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
     * @private
     * @param {DataError | NotExistedError | ProtocolError} error - Error which
     * is throws from `Node`.
     * @throws {DataError | NotExistedError | ProtocolError}
     */
    _handleNodeError(error) {
        if (error instanceof ProtocolError) {
            this._handleProtocolError(error)
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
            case ProtocolError.CODE_EXPLICIT_OVERLOAD:
                this._locker.lockFor(6000)
            case ProtocolError.CODE_BAD_SERVER:
                this._locker.lockFor(60000)
            case ProtocolError.CODE_BAD_RESPONSE:
                this._locker.lockFor(60000)
            case ProtocolError.CODE_BAD_REQUEST:
                throw error
        }
    }
}

module.exports = {
    NoResourceError,
    TrackedNode
}
