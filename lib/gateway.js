'use strict'

const {Log: StdioLog} = require('stdio_log')
const {
    validateInstanceMap, validateArrayItems, mapArray
} = require('minitype')
const {NodeResponse} = require('./node')
const {SafeNode} = require('./safe_node')
const {
    BadError,
    Result,
    EthEndpoint
} = require('./type')
const {
    GATEWAY_NO_BACKEND,
    GATEWAY_BAD_BACKEND
} = require('./type').ErrorCode

class Gateway {
    /**
     * Initialize by {@link Gateway.create}.
     *
     * @param {object} config
     * @param {Array<SafeNode>} config.nodes
     * @param {StdioLog} config.log
     * @param {Gateway} [config.lowerLayer]
     */
    constructor(config) {
        let {nodes, lowerLayer, log} = config
        this._nodes = nodes
        this._lowerLayer = lowerLayer
        this._log = log
        this._nodeIndex = 0
    }

    /**
     *
     * @param {object} config
     * @param {Array<EthEndpoint>} config.endpoints
     * @param {StdioLog} config.log
     * @param {Gateway} [config.lowerLayer]
     * @return {Result<TypeError, Gateway>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['endpoints', Array],
            ['log', StdioLog],
            ['lowerLayer', Gateway, true]
        ])
        if (r1.error) {
            return r1
        }
        let {endpoints, log, lowerLayer} = config
        let r2 = validateArrayItems(endpoints, EthEndpoint)
        if (r2.error) {
            return r2
        }
        let nodes = mapArray(endpoints, endpoint => {
            return SafeNode.create({endpoint, log})
        }).open()
        let data = new Gateway({nodes, log, lowerLayer})
        return Result.ok(data)
    }

    /**
     * Try to serve request by routing calling to nodes. If there is a success
     * then return result. If all nodes return error then try lower layer
     * proxy.
     *
     * @param {string} method - Name of method from `SafeNode`.
     * @param {Array<any>} params - List parameters to pass to method.
     * @return {Promise<Result<BadError, NodeResponse<any>>>}
     */
    async proxy(method, params = []) {
        for (let i = 1; i <= this._nodes.length; ++i) {
            let r1 = this._pickNode()
            if (r1.error) {
                return r1
            }
            let {data: node} = r1
            this._log.info(method, node.host)
            let r2 = await node[method](...params)
            if (r2.error) {
                this._log.info(r2.error.message, node.host)
                continue
            }
            return r2
        }
        if (this._lowerLayer) {
            return await this._lowerLayer.proxy(method, params)
        }
        return Result.badError(GATEWAY_BAD_BACKEND, 'no available nodes')
    }

    /**
     * Just do a simple round robin picking.
     *
     * @private
     * @return {Result<BadError, SafeNode>}
     */
    _pickNode() {
        if (this._nodes.length === 0) {
            return Result.badError(
                GATEWAY_NO_BACKEND, 'expect at least a node'
            )
        }
        let pickedNode = this._nodes[this._nodeIndex]
        this._nodeIndex = (this._nodeIndex + 1) % this._nodes.length
        return Result.ok(pickedNode)
    }
}

module.exports = {
    Gateway
}
