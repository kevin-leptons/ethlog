'use strict'

const axios = require('axios')
const {
    DataError,
    UInt,
    UBigInt,
    HttpEndpoint,
    Block,
    LogFilter,
    Log,
    TransactionHash,
    Transaction,
    assertObject
} = require('./type')

class NodeError extends Error {
    /**
     * Unable connect to node. It could be but not limit: domain name does
     * not exist, IP address serves nothing, handshake failure, connection
     * timeout.
     */
    static CODE_NET_BAD_PEER = 2000

    /**
     * Other errors from network layer.
     */
    static CODE_NET_OTHER = 2999

    /**
     * Client send bad data to server.
     */
    static CODE_HTTP_BAD_REQUEST = 3499

    /**
     * Internal server has issues.
     */
    static CODE_HTTP_BAD_SERVER = 3599

    /**
     * Server responds bad data.
     */
    static CODE_HTTP_BAD_RESPONSE = 3900

    /**
     * Server hints that client make too many errors or
     * other clients make it overload.
     */
    static CODE_HTTP_OVERLOAD = 3901

    /**
     * Other errors from HTTP layer.
     */
    static CODE_HTTP_OTHER = 3999

    /**
     * Client send bad data over JSON RPC layer.
     */
    static CODE_RPC_BAD_REQUEST = 4001

    /**
     * Server responds bad JSON RPC data.
     */
    static CODE_RPC_BAD_RESPONSE = 4002

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
     * @throws {NodeError}
     */
    static throw(code, message, originError = undefined) {
        throw new NodeError(code, message, originError)
    }
}

class Node {
    /**
     *
     * @param {object} config
     * @param {UInt} config.identity
     * @param {HttpEndpoint} config.endpoint
     * @param {UInt} [config.timeout] - Timeout in miliseconds.
     */
    constructor(config) {
        assertObject(config, 'config')
        let {identity, endpoint, timeout} = config
        UInt.assertInstance(identity, 'config.identity')
        HttpEndpoint.assertInstance(endpoint, 'config.identity')
        timeout = timeout || new UInt(3000)
        UInt.assertInstance(timeout)
        this._identity = identity
        this._weight = endpoint.weight
        this._httpClient = axios.create({
            baseURL: endpoint.url.value,
            timeout: timeout.value,
            validateStatus: () => true,
            transformResponse: (response) => response
        })
    }

    /**
     * Retrive number of latest mined block.
     * RPC: `eth_blockNumber`.
     *
     * @returns {Promise<UBigInt>}
     * @throws {DataError | NodeError}
     */
    async getBlockNumber() {
        let result = await this._requestRpc('eth_blockNumber', [])
        return UBigInt.fromHeximal(result)
    }

    /**
     * Retrive log records by filter.
     * RPC: `eth_getLogs`.
     *
     * @param {LogFilter} filter
     * @returns {Promise<Array<Log>>}
     * @throws {DataError | NodeError}
     */
    async getLogs(filter) {
        LogFilter.assertInstance(filter, 'filter')
        let rpcFilter = filter.toRpcInput()
        let logs = await this._requestRpc('eth_getLogs', [rpcFilter])
        return logs.map(Log.fromRpcResult)
    }

    /**
     * Retrieve a block by it's number.
     * RPC: `eth_getBlockByNumber`.
     *
     * @param {UBigInt} blockNumber
     * @returns {Promise<Block>}
     * @throws {DataError | NodeError}
     */
    async getBlockByNumber(blockNumber) {
        UBigInt.assertInstance(blockNumber, 'blockNumber')
        let blockNumberHeximal = blockNumber.toHeximal()
        let result = await this._requestRpc(
            'eth_getBlockByNumber', [blockNumberHeximal, false]
        )
        return Block.fromRpcResult(result)
    }

    /**
     * Retrieve a transaction by it's hash.
     * RPC: `eth_getTransactionByHash`.
     *
     * @param {TransactionHash} hash
     * @returns {Promise<Transaction>}
     * @throws {DataError | NodeError}
     */
    async getTransactionByHash(hash) {
        TransactionHash.assertInstance(hash, 'hash')
        let hashHeximal = hash.toHeximal()
        let result = await this._requestRpc(
            'eth_getTransactionByHash', [hashHeximal]
        )
        return Transaction.fromRpcResult(result)
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
        let responseBody = await this._requestHttp({
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        if (typeof responseBody !== 'object') {
            NodeError.throw(
                NodeError.CODE_RPC_BAD_RESPONSE, 'not an object: response data'
            )
        }
        let {error, result} = responseBody
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
     * @private
     * @param {object} requestBody
     * @returns {object}
     * @throws {NodeError}
     */
    async _requestHttp(requestBody) {
        let {status, data} = await this._requestRawHttp(requestBody)
        if (status >= 200 && status < 300) {
            return Node._parseJson(data)
        }
        if (status === 429 || status === 503) {
            NodeError.throw(
                NodeError.CODE_HTTP_OVERLOAD,
                'server overload',
                data
            )
        }
        if (status >= 400 && status < 500) {
            NodeError.throw(
                NodeError.CODE_HTTP_BAD_REQUEST,
                'bad request data',
                data
            )
        }
        if (status >= 500 && status < 600) {
            NodeError.throw(
                NodeError.CODE_HTTP_BAD_SERVER,
                'bad server status',
                data
            )
        }
        NodeError.throw(
            NodeError.CODE_HTTP_OTHER,
            `response status: ${status}`,
            data
        )
    }

    /**
     * @private
     * @param {object} requestBody
     * @returns {object}
     * @throws {NodeError}
     */
    async _requestRawHttp(requestBody) {
        try {
            return await this._httpClient.post('/', requestBody)
        }
        catch (error) {
            if (error instanceof NodeError) {
                throw error
            }
            switch (error.code) {
                case 'ENOTFOUND':
                case 'ECONNABORTED':
                case 'ECONNREFUSED':
                    throw new NodeError(
                        NodeError.CODE_NET_BAD_PEER, error.message, error
                    )
                default:
                    throw new NodeError(
                        NodeError.CODE_NET_OTHER, error.message, error
                    )
            }
        }
    }

    /**
     * @private
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
                NodeError.CODE_HTTP_BAD_RESPONSE,
                'invalid JSON format from response body',
                error
            )
        }
    }
}

module.exports = {
    NodeError,
    Node
}
