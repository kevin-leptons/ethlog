'use strict'

const axios = require('axios')
const {
    DataError,
    UInt,
    UBigInt,
    HttpEndpoint,
    Block,
    LogFilter,
    assertObject
} = require('./type')
const {
    isUnsignedInteger,
    isTransactionHashHeximal
} = require('./validator')
const {
    numberToHeximal,
    heximalToNumber,
} = require('./formatter')

class NodeError extends Error {
    static CODE_OTHER = 1
    /**
     * Unable connect to node. It could be domain name does not exist,
     * IP address serves nothing, handshake failure, connection timeout...
     */
    static CODE_NET_BAD_PEER = 2
    static CODE_RPC_BAD_REQUEST = 3
    static CODE_RPC_BAD_RESPONSE = 4
    static CODE_RPC_OVERLOAD = 5

    /**
     *
     * @param {number} code - One of constants `NodeError.CODE_*`.
     * @param {string} message
     * @param {Error} originError
     */
    constructor(code, message, originError = undefined) {
        super(message)
        this.name = 'NodeError'
        this._code = code
        this._originError = originError
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
    get originError() {
        return this._originError
    }

    /**
     * Shortcut to throw error than `throw new Error()`.
     * Input is similar like `constructor()`.
     *
     * @param {number} code
     * @param {string} message
     * @param {Error} originError
     */
    static throw(code, message, originError = undefined) {
        throw new NodeError(code ,message, originError)
    }
}

class Node {
    /**
     *
     * @param {object} config
     * @param {UInt} config.identity
     * @param {HttpEndpoint} config.endpoint
     */
    constructor(config) {
        assertObject(config, 'config')
        let {identity, endpoint} = config
        UInt.assertInstance(identity, 'config.identity')
        HttpEndpoint.assertInstance(endpoint, 'config.identity')
        this._identity = identity
        this._weight = endpoint.weight
        this._httpClient = axios.create({
            baseURL: endpoint.url.value,
            timeout: 1000,
            validateStatus: () => true,
            transformResponse: (response) => response
        })
    }

    /**
     * Retrive number of latest mined block.
     *
     * @returns {Promise<UBigInt>}
     */
    async getBlockNumber() {
        let result = await this._requestRpc('eth_blockNumber', [])
        return UBigInt.fromHeximal(result)
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Promise<Array<Log>>}
     */
    async getLogs(filter) {
        LogFilter.assertInstance(filter, 'not a log filter: filter')
        let rpcFilter = filter.toRpcInput()
        let logs = await this._requestRpc('eth_getLogs', [rpcFilter])
        logs.forEach(formatLogInplace)
        return logs
    }

    /**
     *
     * @param {UBigInt} blockNumber
     * @returns {Promise<Block>}
     */
    async getBlockByNumber(blockNumber) {
        UBigInt.assertInstance(blockNumber, 'blockNumber')
        let blockNumberHeximal = blockNumber.toHeximal()
        let result = await this._requestRpc(
            'eth_getBlockByNumber',
            [blockNumberHeximal, false]
        )
        return Block.fromRpcResult(result)
    }

    /**
     * Retrieve a transaction by it's hash.
     * It is equivalent to RPC `eth_getTransactionByHash`.
     *
     * @param {TransactionHashHeximal} hash
     * @returns {Transaction | undefined}
     * @throws {ClientError}
     */
    async getTransactionByHash(hash) {
        if (!isTransactionHashHeximal(hash)) {
            throw new EthLogError('not a transaction hash heximal')
        }
        let transaction = await this._requestRpc(
            'eth_getTransactionByHash',
            [hash]
        )
        formatTransactionInplace(transaction)
        return transaction
    }

    /**
     * Request a ETH JSON RPC call to this node.
     *
     * @private
     * @param {string} method - For list of methods and it's specifications,
     * see [ETH JSON RPC](https://eth.wiki/json-rpc/API).
     * @param {any} params
     * @returns {Promise<any>}
     * @throws {NodeError}
     */
    async _requestRpc(method, params) {
        let {status, data: rawBody} = await this._requestHttp({
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        if (status < 200 || status >= 300) {
            NodeError.throw(
                NodeError.CODE_RPC_BAD_REQUEST, `status=${status}`, rawBody)
        }
        let body = Node._parseJson(rawBody)
        if (typeof body !== 'object') {
            NodeError.throw(
                NodeError.CODE_RPC_BAD_REQUEST, 'not an object: body'
            )
        }
        let {error, result} = body
        if (error) {
            if (!error.message) {
                NodeError.throw(
                    NodeError.CODE_RPC_BAD_REQUEST, 'invalid error object'
                )
            }
            NodeError.throw(
                NodeError.CODE_RPC_BAD_REQUEST, error.message, error
            )
        }
        return result
    }

    /**
     *
     * @param {object} body
     * @throws {NodeError}
     */
    async _requestHttp(body) {
        try {
            return await this._httpClient.post('/', body)
        }
        catch (error) {
            switch (error.code) {
                case 'ENOTFOUND':
                case 'ECONNABORTED':
                case 'ECONNREFUSED':
                    NodeError.throw(
                        NodeError.CODE_NET_BAD_PEER, error.message, error
                    )
            }
            throw error
        }
    }

    /**
     *
     * @param {string} body - JSON string.
     * @returns {object}
     * @throws {NodeError}
     */
    static _parseJson(body) {
        try {
            return JSON.parse(body)
        }
        catch (error) {
            NodeError.throw(
                NodeError.CODE_RPC_BAD_RESPONSE, error.message, error
            )
        }
    }
}

/**
 * @private
 * @param {any} log
 * @returns {Log}
 */
function formatLogInplace(log) {
    log.blockNumber = heximalToNumber(log.blockNumber)
    log.logIndex = heximalToNumber(log.logIndex)
    log.transactionIndex = heximalToNumber(log.transactionIndex)
}

/**
 * Convert data type of attributes inplace.
 *
 * @private
 * @param {any} tx
 */
function formatTransactionInplace(tx) {
    tx.blockNumber = heximalToNumber(tx.blockNumber)
    tx.transactionIndex = heximalToNumber(tx.transactionIndex)
    tx.type = heximalToNumber(tx.type)
    tx.nonce = heximalToNumber(tx.nonce)
    tx.gas = BigInt(tx.gas)
    tx.gasPrice = BigInt(tx.gasPrice)
}

module.exports = {
    NodeError,
    Node
}
