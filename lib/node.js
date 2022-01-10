'use strict'

const axios = require('axios')
const {
    ErrorCode,
    Result,
    BigUInt,
    Timespan,
    ByteData32,
    HttpEndpoint,
    Block,
    LogFilter,
    Log,
    Transaction
} = require('./type')

class Node {
    /**
     *
     * @param {object} config
     * @param {HttpEndpoint} config.endpoint
     * @param {Timespan} [config.timeout]
     */
    constructor(config) {
        let {endpoint, timeout} = config
        timeout = timeout || new Timespan(3000)
        this._httpClient = axios.create({
            baseURL: endpoint.url.value,
            timeout: timeout.value,
            headers: Node._createHttpClientHeaders(endpoint),
            validateStatus: () => true,
            transformResponse: (response) => response
        })
    }

    /**
     * Retrive number of latest mined block.
     * RPC: `eth_blockNumber`.
     *
     * @return {Promise<Result<BigUInt>>}
     */
    async getBlockNumber() {
        let {error, data} = await this._requestRpc('eth_blockNumber', [])
        if (error) {
            return Result.error(error)
        }
        let {error: e2, data: blockNumber} = BigUInt.fromHeximal(data)
        if (e2) {
            return Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad block number')
        }
        return Result.ok(blockNumber)
    }

    /**
     * Retrieve a block by it's number.
     * RPC: `eth_getBlockByNumber`.
     *
     * @param {BigUInt} blockNumber
     * @return {Promise<Result<Block>>}
     */
    async getBlockByNumber(blockNumber) {
        let heximal = blockNumber.toHeximal()
        let {error, message, data} = await this._requestRpc(
            'eth_getBlockByNumber', [heximal, false]
        )
        if (error) {
            return Result.error(error, message)
        }
        if (!data) {
            return Result.error(
                ErrorCode.ETH_NO_BLOCK, 'missing or not mined yet'
            )
        }
        let {error: e2, data: block} = Block.fromRpcResult(data)
        if (e2) {
            return Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad block')
        }
        return Result.ok(block)
    }

    /**
     * Retrieve a transaction by it's hash.
     * RPC: `eth_getTransactionByHash`.
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<Transaction>>}
     */
    async getTransactionByHash(hash) {
        let heximal = hash.toHeximal()
        let {error, message, data} = await this._requestRpc(
            'eth_getTransactionByHash', [heximal]
        )
        if (error) {
            return Result.error(error, message)
        }
        if (!data) {
            return Result.error(
                ErrorCode.ETH_NO_TRANSACTION, 'missing or not mined yet'
            )
        }
        let {error: e2, data: transaction} = Transaction.fromRpcResult(data)
        if (e2) {
            return Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad transaction')
        }
        return Result.ok(transaction)
    }

    /**
     * Retrive log records by filter.
     * RPC: `eth_getLogs`.
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<Array<Log>>>}
     */
    async getLogs(filter) {
        let params = filter.toRpcInput()
        let {error, message, data} = await this._requestRpc(
            'eth_getLogs', [params]
        )
        if (error) {
            return Result.error(error, message)
        }
        if (!Array.isArray(data)) {
            return Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad log records')
        }
        let logs = []
        for (let item of data) {
            let {error: e2, data: log} = Log.fromRpcResult(item)
            if (e2) {
                return Result.error(
                    ErrorCode.ETH_BAD_RESPONSE, 'bad log record'
                )
            }
            logs.push(log)
        }
        return Result.ok(logs)
    }

    /**
     * Request a JSON RPC call to server.
     *
     * @private
     * @param {string} method - For list of methods and it's specifications,
     * see [ETH JSON RPC](https://eth.wiki/json-rpc/API).
     * @param {any} params
     * @return {Promise<Result<any>>}
     */
    async _requestRpc(method, params) {
        let {error, data: responseBody} = await this._requestHttp({
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        if (error) {
            return Result.error(error, method)
        }
        let {error: e2, result} = responseBody || {}
        if (e2) {
            return Node._parseRpcError(e2)
        }
        else if (result !== undefined) {
            return Result.ok(result)
        }
        return Result.error(
            ErrorCode.ETH_BAD_RESPONSE, 'json rpc v2: invalid response'
        )
    }

    /**
     * @private
     * @param {object} body - Request body.
     * @return {Promise<Result<object>>} - Parsed body.
     */
    async _requestHttp(body) {
        let {error, message, data: response} = await this._requestRawHttp(body)
        if (error) {
            return Result.error(error, message)
        }
        let {status, data: responseBody} = response
        if (status >= 200 && status < 300) {
            return Node._parseJson(responseBody)
        }
        if (status === 429 || status === 503) {
            return Result.error(
                ErrorCode.ETH_EXPLICIT_OVERLOADING, `http status: ${status}`
            )
        }
        if (status >= 400 && status < 500) {
            return Result.error(
                ErrorCode.ETH_BAD_REQUEST, `http status: ${status}`
            )
        }
        if (status >= 500 && status < 600) {
            return Result.error(
                ErrorCode.ETH_BAD_SERVER, `http status: ${status}`
            )
        }
        return Result.error(
            ErrorCode.ETH_BAD_RESPONSE, `http status: ${status}`
        )
    }

    /**
     * @private
     * @param {object} body - Request body.
     * @return {Promise<Result<axios.AxiosResponse>>}
     */
    async _requestRawHttp(body) {
        try {
            let response = await this._httpClient.post('/', body)
            return Result.ok(response)
        }
        catch (error) {
            let {code, message} = error
            switch (code) {
                case 'ENOTFOUND':
                case 'ECONNABORTED':
                case 'ECONNREFUSED':
                    return Result.error(
                        ErrorCode.ETH_IMPLICIT_OVERLOADING, message
                    )
                default:
                    return Result.error(
                        ErrorCode.ETH_BAD_SERVER, message
                    )
            }
        }
    }

    /**
     * @private
     * @param {string} data - JSON string.
     * @return {Result<number | string | object | Array>} - Parsed object.
     */
    static _parseJson(data) {
        try {
            let parsed = JSON.parse(data)
            return Result.ok(parsed)
        }
        catch (error) {
            return Result.error(
                ErrorCode.ETH_BAD_RESPONSE,
                'http body: invalid JSON format'
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
     * @return {Result<undefined>}
     */
    static _parseRpcError(error) {
        let {message} = error || {}
        if (message === undefined) {
            return Result.error(
                ErrorCode.ETH_BAD_RESPONSE,
                'json rpc v2: no error message'
            )
        }
        return Result.error(ErrorCode.ETH_BAD_REQUEST, message)
    }

    /**
     *
     * @param {HttpEndpoint} endpoint
     * @return {object}
     */
    static _createHttpClientHeaders(endpoint) {
        let {username, password} = endpoint
        if (!username || !password) {
            return {}
        }
        let certificate = username + ':' + password
        let certificateEncoded = Buffer.from(certificate).toString('base64')
        return {
            'authorization': 'basic ' + certificateEncoded
        }
    }
}

module.exports = {
    Node,
    Result,
    ErrorCode
}
