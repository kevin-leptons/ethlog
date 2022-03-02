'use strict'

const axios = require('axios')
const {
    UInt64,
    DataSize,
    Timespan,
    Timestamp,
    validateInstanceMap,
    validateInstance,
    mapArray
} = require('minitype')
const {
    Result,
    BadError,
    ByteData32,
    HttpEndpoint,
    Block,
    LogFilter,
    Log,
    Transaction
} = require('./type')
const {
    NODE_OVERLOADING,
    NODE_BAD_REQUEST,
    NODE_BAD_RESPONSE,
    NODE_BAD_SERVER,
    NODE_NO_BLOCK,
    NODE_NO_TRANSACTION
} = require('./type').ErrorCode

class HttpResponse {
    /**
     *
     * @param {object} values
     * @param {number} values.status
     * @param {object} values.body
     * @param {Timespan} values.time
     * @param {DataSize} values.size
     */
    constructor(values) {
        this.status = values.status
        this.body = values.body
        this.time = values.time
        this.size = values.size
    }

    /**
     *
     * @param {axios.AxiosResponse} response
     * @param {Timespan} responseTime
     * @return {Result<TypeError, HttpResponse>}
     */
    static fromAxiosResponse(response, responseTime) {
        let r1 = validateInstanceMap(response, [
            ['status', 'number'],
            ['data', 'string', true]
        ], false)
        if (r1.error) {
            return r1
        }
        let r2 = validateInstance(responseTime, Timespan)
        if (r2.error) {
            return r2
        }
        let {status, data: body} = response
        let bodySize = body ? body.length : 0
        let data = new HttpResponse({
            status: status,
            body: body,
            time: responseTime,
            size: DataSize.fromBytes(bodySize).open()
        })
        return Result.ok(data)
    }
}

class JsonResponse {
    /**
     *
     * @param {object} values
     * @param {object} values.data - Response data.
     * @param {DataSize} values.size - Response size.
     * @param {Timespan} values.time - Response time.
     */
    constructor(values) {
        this.data = values.data
        this.size = values.size
        this.time = values.time
    }

    /**
     *
     * @param {HttpResponse} httpResponse
     * @return {Result<BadError, JsonResponse>}
     */
    static fromHttpResponse(httpResponse) {
        let {status} = httpResponse
        if (status >= 200 && status < 300) {
            return JsonResponse._parseHttpResponse(httpResponse)
        }
        let message = `http status ${status}`
        if (status === 429 || status === 503) {
            return Result.badError(NODE_OVERLOADING, message, httpResponse)
        }
        if (status >= 400 && status < 500) {
            return Result.badError(NODE_BAD_REQUEST, message, httpResponse)
        }
        if (status >= 500 && status < 600) {
            return Result.badError(NODE_BAD_SERVER, message, httpResponse)
        }
        return Result.badError(NODE_BAD_RESPONSE, message, httpResponse)
    }

    /**
     * @private
     * @param {HttpResponse} httpResponse
     * @return {Result<BadError, JsonResponse>}
     */
    static _parseHttpResponse(httpResponse) {
        let {body, time, size} = httpResponse
        let parsedBody = JsonResponse._parseJson(body)
        if (parsedBody === undefined) {
            let message = 'expect valid JSON format'
            return Result.badError(NODE_BAD_RESPONSE, message, httpResponse)
        }
        let data = new JsonResponse({
            data: parsedBody,
            time: time,
            size: size
        })
        return Result.ok(data)
    }

    /**
     * @private
     * @param {string} data - JSON string.
     * @return {object | undefined} - Parsed object.
     */
    static _parseJson(data) {
        try {
            return JSON.parse(data)
        }
        catch {
            return undefined
        }
    }
}

class RpcResponse {
    /**
     * @param {object} values
     */
    constructor(values) {
        this.data = values.data
        this.time = values.time
        this.size = values.size
    }

    /**
     *
     * @param {*} values
     * @param {object} values.data - Correspond to field `body.result`, where
     * body is parsed HTTP response body.
     * @param {Timespan} values.time
     * @param {DataSize} values.size
     * @return {Result<TypeError, RpcResponse>}
     */
    static create(values) {
        let r1 = validateInstanceMap(values, [
            ['data', 'any'],
            ['time', Timespan],
            ['size', DataSize]
        ])
        if (r1.error) {
            return r1
        }
        let data = new RpcResponse(values)
        return Result.ok(data)
    }

    /**
     *
     * @param {JsonResponse} jsonResponse
     * @return {Result<BadError, RpcResponse>}
     */
    static fromJsonResponse(jsonResponse) {
        if (jsonResponse.data.error) {
            return RpcResponse._makeError(jsonResponse)
        }
        else if (jsonResponse.data.result !== undefined) {
            let data = new RpcResponse({
                data: jsonResponse.data.result,
                time: jsonResponse.time,
                size: jsonResponse.size
            })
            return Result.ok(data)
        }
        let message = 'no error or result from RPC'
        return Result.badError(NODE_BAD_RESPONSE, message, jsonResponse)
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
     * @param {JsonResponse} jsonResponse
     * @return {Result<BadError, undefined>}
     */
    static _makeError(jsonResponse) {
        let {message} = jsonResponse.data.error
        if (message === undefined) {
            let message = 'json rpc v2: no error message'
            return Result.badError(NODE_BAD_RESPONSE, message, jsonResponse)
        }
        return Result.badError(NODE_BAD_REQUEST, message, jsonResponse)
    }
}

/**
 * @template D
 */
class NodeResponse {
    /**
     * @param {object} values
     * @param {D} values.data
     * @param {Timespan} values.time
     * @param {DataSize} values.size - HTTP body size as decoded string, does
     * not include other components of a HTTP message.
     */
    constructor(values) {
        this.data = values.data
        this.time = values.time
        this.size = values.size
    }

    /**
     *
     * @param {object} input
     * @param {D} input.data
     * @param {Timespan} input.time
     * @param {DataSize} input.size
     * @return {Result<TypeError, NodeResponse>}
     */
    static create(input) {
        let r1 = validateInstanceMap(input, [
            ['data', 'any'],
            ['time', Timespan],
            ['size', DataSize]
        ])
        if (r1.error) {
            return r1
        }
        let data = new NodeResponse(input)
        return Result.ok(data)
    }

    /**
     * Create a new response with an other data, other information is keep no
     * changes.
     *
     * @param {any} data
     * @return {NodeResponse}
     */
    cloneWithNewData(data) {
        return new NodeResponse({
            data: data,
            time: this.time.clone(),
            size: this.size.clone()
        })
    }
}

class Node {
    /**
     * Host name or IP address that refers to Ethereum node.
     *
     * @type {string}
     */
    get host() {
        return this._host
    }

    /**
     * Initialize by {@link Node.create}.
     *
     * @param {object} config
     * @param {HttpEndpoint} config.endpoint
     */
    constructor(config) {
        let {endpoint} = config
        let {url, username, password, timeout} = endpoint
        this._httpClient = axios.create({
            baseURL: url.value.toString(),
            timeout: timeout.value,
            headers: Node._makeHttpClientHeaders(username, password),
            validateStatus: () => true,
            transformResponse: (response) => response
        })
        this._host = endpoint.url.value.host
    }

    /**
     * Retrive number of latest mined block.
     * RPC: `eth_blockNumber`.
     *
     * @return {Promise<Result<BadError, NodeResponse<UInt64>>>}
     */
    async getBlockNumber() {
        let r1 = await this._requestRpc('eth_blockNumber', [])
        if (r1.error) {
            return r1
        }
        let r2 = UInt64.fromHeximal(r1.data.data)
        if (r2.error) {
            return Result.badError(
                NODE_BAD_RESPONSE, r2.error.message, r1.data
            )
        }
        let {data: rpcResponse} = r1
        let {data: blockNumber} = r2
        let data = NodeResponse.create({
            data: blockNumber,
            time: rpcResponse.time,
            size: rpcResponse.size
        }).open()
        return Result.ok(data)
    }

    /**
     * Retrieve a block by it's number.
     * RPC: `eth_getBlockByNumber`.
     *
     * @param {UInt64} blockNumber
     * @return {Promise<Result<BadError, NodeResponse<Block>>>}
     */
    async getBlockByNumber(blockNumber) {
        let heximal = blockNumber.toHeximal()
        let r1 = await this._requestRpc(
            'eth_getBlockByNumber', [heximal, false]
        )
        if (r1.error) {
            return r1
        }
        let {data: rpcResponse} = r1
        let {data: result} = rpcResponse
        if (!result) {
            return Result.badError(NODE_NO_BLOCK, 'missing or not mined yet')
        }
        let r2 = Block.fromRpcResult(result)
        if (r2.error) {
            return Result.badError(
                NODE_BAD_RESPONSE, r2.error.message, rpcResponse
            )
        }
        let {data: block} = r2
        let data = NodeResponse.create({
            data: block,
            time: rpcResponse.time,
            size: rpcResponse.size
        }).open()
        return Result.ok(data)
    }

    /**
     * Retrieve a transaction by it's hash.
     * RPC: `eth_getTransactionByHash`.
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<BadError, NodeResponse<Transaction>>>}
     */
    async getTransactionByHash(hash) {
        let heximal = hash.toHeximal()
        let r1 = await this._requestRpc('eth_getTransactionByHash', [heximal])
        if (r1.error) {
            return r1
        }
        let {data: rpcResponse} = r1
        let {data: result} = rpcResponse
        if (!result) {
            return Result.badError(
                NODE_NO_TRANSACTION, 'missing or not mined yet'
            )
        }
        let r2 = Transaction.fromRpcResult(result)
        if (r2.error) {
            return Result.badError(
                NODE_BAD_RESPONSE, r2.error.message, rpcResponse
            )
        }
        let {data: transaction} = r2
        let data = NodeResponse.create({
            data: transaction,
            time: rpcResponse.time,
            size: rpcResponse.size
        }).open()
        return Result.ok(data)
    }

    /**
     * Retrive log records by filter.
     * RPC: `eth_getLogs`.
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<BadError, NodeResponse<Array<Log>>>>}
     */
    async getLogs(filter) {
        let params = filter.toRpcInput()
        let r1 = await this._requestRpc('eth_getLogs', [params])
        if (r1.error) {
            return r1
        }
        let {data: rpcResponse} = r1
        let r2 = mapArray(rpcResponse.data, Log.fromRpcResult)
        if (r2.error) {
            return Result.badError(NODE_BAD_RESPONSE, r2.error, rpcResponse)
        }
        let {data: logs} = r2
        let data = NodeResponse.create({
            data: logs,
            time: rpcResponse.time,
            size: rpcResponse.size
        }).open()
        return Result.ok(data)
    }

    /**
     *
     * @param {object} config
     * @param {HttpEndpoint} config.endpoint
     * @return {Result<TypeError, Node>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['endpoint', HttpEndpoint]
        ])
        if (r1.error) {
            return r1
        }
        let data = new Node(config)
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
        let r1 = await this._requestRpc(method, params)
        if (r1.error) {
            return r1
        }
        let {data: rpcResponse} = r1
        let r2 = NodeResponse.create({
            data: rpcResponse.data,
            time: rpcResponse.time,
            size: rpcResponse.size
        })
        if (r2.error) {
            return r2
        }
        let {data: instance} = r2
        return Result.ok(instance)
    }

    /**
     * Request a JSON RPC call to server.
     *
     * @private
     * @param {string} method - For list of methods and it's specifications,
     * see [ETH JSON RPC](https://eth.wiki/json-rpc/API).
     * @param {any} params
     * @return {Promise<Result<BadError, RpcResponse>>}
     */
    async _requestRpc(method, params) {
        let r1 = await this._requestHttpJson({
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        if (r1.error) {
            return r1
        }
        return RpcResponse.fromJsonResponse(r1.data)
    }

    /**
     * @private
     * @param {object} httpRequestBody
     * @return {Promise<Result<BadError, JsonResponse>>}
     */
    async _requestHttpJson(httpRequestBody) {
        let r1 = await this._requestHttp(httpRequestBody)
        if (r1.error) {
            return r1
        }
        return JsonResponse.fromHttpResponse(r1.data)
    }

    /**
     * @private
     * @param {object} requestBody
     * @return {Promise<Result<BadError, HttpResponse>>}
     */
    async _requestHttp(requestBody) {
        try {
            let beginTime = Timestamp.now()
            let response = await this._httpClient.post('/', requestBody)
            let elapsedTime = Timespan.elapsedTime(beginTime).open()
            let data = HttpResponse
                .fromAxiosResponse(response, elapsedTime)
                .open()
            return Result.ok(data)
        }
        catch (error) {
            let {code, message} = error
            switch (code) {
                case 'ENOTFOUND':
                case 'ECONNABORTED':
                case 'ECONNREFUSED':
                    return Result.badError(NODE_OVERLOADING, message)
                default:
                    return Result.badError(NODE_BAD_SERVER, message)
            }
        }
    }

    /**
     * @private
     * @param {string} username
     * @param {string} password
     * @return {object} Headers which is map by name.
     */
    static _makeHttpClientHeaders(username, password) {
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
    HttpResponse,
    JsonResponse,
    RpcResponse,
    NodeResponse
}
