'use strict'

const axios = require('axios')
const {
    DataError,
    NotExistedError,
    UInt,
    BigUInt,
    HttpEndpoint,
    Block,
    LogFilter,
    Log,
    TransactionHash,
    Transaction,
    assertObject
} = require('./type')

/**
 * Report errors from layer JSON RPC to lower ones such as HTTP and network.
 */
class ProtocolError extends Error {
    /**
     * Client should reduce number of requests and data range to server.
     * This error is not always overload from server because there are no
     * explicit clues for confirmation. The reasons can be but not limit:
     * domain name does not exist, IP address is unreachable, server does
     * not serve anything, handshake failure, connection timeout, firewall
     * blocks requests, requests in long queue, server limits client requests.
     */
    static CODE_IMPLICIT_OVERLOAD = 1

    /**
     * Client should reduce number of requests and data range to server
     * immediately because server shows it clearly. This hint come from HTTP
     * layer by status code `429 - Too Many Requests` or
     * `503 - Service Unavailable`.
     */
    static CODE_EXPLICIT_OVERLOAD = 2

    /**
     * Server responds bad data which is not in specifications. It come from
     * both HTTP and JSON RPC layer. Client should try later and hope that
     * server is fixed.
     */
    static CODE_BAD_RESPONSE = 3

    /**
     * Server complains about request data from client because it does not
     * meet specifications. This error is internal of this library and must
     * be fix. If caller has nothing to deal with it then report error and
     * terminate process.
     */
    static CODE_BAD_REQUEST = 4

    /**
     * Server hints that there are errors occurs and it's unable to handle
     * it. Client should try later and hope that server is fixed.
     */
    static CODE_BAD_SERVER = 5

    /**
     *
     * @param {number} code - One of constants `ProtocolError.CODE_*`.
     * @param {string} message - Short description about what going on.
     * @param {Error | string} [cause] - The original error.
     */
    constructor(code, message, cause=undefined) {
        super(message)
        this.name = 'ProtocolError'
        this._code = code
        this._cause = cause
    }

    /**
     * Error code, one of constants `ProtocolError.CODE_*`.
     * @type {number}
     */
    get code() {
        return this._code
    }

    /**
     * The original error.
     *
     * @type {Error | string | undefined}
     */
    get cause() {
        return this._cause
    }
}

/**
 * First layer that interacts with ETH-like node through JSON RPC.
 */
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
     * @returns {Promise<BigUInt>}
     * @throws {DataError | ProtocolError}
     */
    async getBlockNumber() {
        let result = await this._requestRpc('eth_blockNumber', [])
        try {
            return BigUInt.fromHeximal(result)
        }
        catch (error) {
            if (error instanceof DataError) {
                throw new ProtocolError(
                    ProtocolError.CODE_RPC_BAD_RESPONSE,
                    'eth_blockNumber returns bad data',
                    error
                )
            }
            throw error
        }
    }

    /**
     * Retrive log records by filter.
     * RPC: `eth_getLogs`.
     *
     * @param {LogFilter} filter
     * @returns {Promise<Array<Log>>}
     * @throws {DataError | ProtocolError}
     */
    async getLogs(filter) {
        LogFilter.assertInstance(filter, 'filter')
        let rpcFilter = filter.toRpcInput()
        let logs = await this._requestRpc('eth_getLogs', [rpcFilter])
        try {
            return logs.map(Log.fromRpcResult)
        }
        catch (error) {
            if (error instanceof DataError) {
                throw new ProtocolError(
                    ProtocolError.CODE_RPC_BAD_RESPONSE,
                    'eth_getLogs returns bad data',
                    error
                )
            }
            throw error
        }
    }

    /**
     * Retrieve a block by it's number.
     * RPC: `eth_getBlockByNumber`.
     *
     * @param {BigUInt} blockNumber
     * @returns {Promise<Block>}
     * @throws {DataError | NotExistedError | ProtocolError}
     */
    async getBlockByNumber(blockNumber) {
        BigUInt.assertInstance(blockNumber, 'blockNumber')
        let blockNumberHeximal = blockNumber.toHeximal()
        let result = await this._requestRpc(
            'eth_getBlockByNumber', [blockNumberHeximal, false]
        )
        if (!result) {
            throw new NotExistedError('block', blockNumber.toHeximal())
        }
        try {
            return Block.fromRpcResult(result)
        }
        catch (error) {
            if (error instanceof DataError) {
                throw new ProtocolError(
                    ProtocolError.CODE_RPC_BAD_RESPONSE,
                    'eth_getBlockByNumber returns bad data',
                    error
                )
            }
            throw error
        }
    }

    /**
     * Retrieve a transaction by it's hash.
     * RPC: `eth_getTransactionByHash`.
     *
     * @param {TransactionHash} hash
     * @returns {Promise<Transaction>}
     * @throws {DataError | NotExistedError |  ProtocolError}
     */
    async getTransactionByHash(hash) {
        TransactionHash.assertInstance(hash, 'hash')
        let hashHeximal = hash.toHeximal()
        let result = await this._requestRpc(
            'eth_getTransactionByHash', [hashHeximal]
        )
        if (!result) {
            throw new NotExistedError('transaction hash', hash.toHeximal())
        }
        try {
            return Transaction.fromRpcResult(result)
        }
        catch (error) {
            if (error instanceof DataError) {
                throw new ProtocolError(
                    ProtocolError.CODE_RPC_BAD_RESPONSE,
                    'eth_getTransactionByHash returns bad data',
                    error
                )
            }
            throw error
        }
    }

    /**
     * Request a ETH JSON RPC call to this node.
     *
     * @private
     * @param {string} method - For list of methods and it's specifications,
     * see [ETH JSON RPC](https://eth.wiki/json-rpc/API).
     * @param {any} params
     * @returns {Promise<any>}
     * @throws {ProtocolError}
     */
    async _requestRpc(method, params) {
        let responseBody = await this._requestHttp({
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        let {error, result} = responseBody || {}
        if (error) {
            Node._handleRpcError(error)
        }
        else if (result !== undefined) {
            return result
        }
        throw new ProtocolError(
            ProtocolError.CODE_BAD_RESPONSE, 'server responds invalid JSON RPC'
        )
    }

    /**
     * @private
     * @param {object} body - Request body.
     * @returns {object} - Parsed body.
     * @throws {ProtocolError}
     */
    async _requestHttp(body) {
        let {status, data: responseBody} = await this._requestRawHttp(body)
        if (status >= 200 && status < 300) {
            return Node._parseJson(responseBody)
        }
        if (status === 429 || status === 503) {
            throw new ProtocolError(
                ProtocolError.CODE_EXPLICIT_OVERLOAD,
                'server responds explicit overload',
                responseBody
            )
        }
        if (status >= 400 && status < 500) {
            throw new ProtocolError(
                ProtocolError.CODE_BAD_REQUEST,
                'server responds bad client request',
                responseBody
            )
        }
        if (status >= 500 && status < 600) {
            throw new ProtocolError(
                ProtocolError.CODE_BAD_SERVER,
                'server responds internal error',
                responseBody
            )
        }
        throw new ProtocolError(
            ProtocolError.CODE_BAD_RESPONSE,
            `server responds invalid status: ${status}`,
            responseBody
        )
    }

    /**
     * @private
     * @param {object} body - Request body.
     * @returns {object} - Response body as a string.
     * @throws {ProtocolError}
     */
    async _requestRawHttp(body) {
        try {
            return await this._httpClient.post('/', body)
        }
        catch (error) {
            switch (error.code) {
                case 'ENOTFOUND':
                case 'ECONNABORTED':
                case 'ECONNREFUSED':
                    throw new ProtocolError(
                        ProtocolError.CODE_IMPLICIT_OVERLOAD,
                        error.message,
                        error
                    )
                default:
                    throw new ProtocolError(
                        ProtocolError.CODE_BAD_SERVER, error.message, error
                    )
            }
        }
    }

    /**
     * @private
     * @param {string} data - JSON string.
     * @returns {number | string | array | object} - Parsed object.
     * @throws {ProtocolError}
     */
    static _parseJson(data) {
        try {
            return JSON.parse(data)
        }
        catch (error) {
            throw new ProtocolError(
                ProtocolError.CODE_BAD_RESPONSE,
                'invalid JSON format from HTTP response body',
                error
            )
        }
    }

    /**
     * ETH RPC does not follow JSON RPC 2.0 specifications. It does not return
     * standard error codes such as: -32700, -32600, -32601, -32602. They do
     * not define their own too. Because of that, there is no way to clarify
     * error comes from client or sever. All valid error responses without
     * `message` is consider as `CODE_BAD_RESPONSE`, other ones it is
     * consider as `CODE_BAD_RESPONSE`.
     *
     * See [JSON RPC 2.0](https://jsonrpc.org/historical/json-rpc-2-0.html)
     * fore more details about error code.
     *
     * @private
     * @param {object} error - It is `body.error` where `body` is parsed
     * object from HTTP response body.
     * @throws {ProtocolError}
     */
    static _handleRpcError(error) {
        let {message} = error || {}
        if (message === undefined) {
            throw new ProtocolError(
                ProtocolError.CODE_BAD_RESPONSE,
                'server responds error but there is no message'
            )
        }
        throw new ProtocolError(
            ProtocolError.CODE_BAD_REQUEST, message, error
        )
    }
}

module.exports = {
    ProtocolError,
    Node
}
