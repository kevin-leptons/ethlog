'use strict'

const log = require('stdio_log')
const {
    ErrorCode,
    Result,
    Endpoint,
    assertObjectAttributes,
    assertInstance,
    assertArray
} = require('./type')
const {SafeNode} = require('./safe_node')

class Gateway {
    /**
     *
     * @param {object} config
     * @param {Array<Endpoint>} config.endpoints
     * @param {Gateway} [config.lowerLayer]
     */
    constructor(config) {
        assertObjectAttributes(config, ['endpoints', 'lowerLayer'])
        let { endpoints, lowerLayer } = config
        assertArray(endpoints)
        endpoints.forEach((v, i) => {
            assertInstance(v, Endpoint, `endpoints[${i}]`)
        })
        if (lowerLayer) {
            assertInstance(lowerLayer, Gateway, 'lowerLayer')
        }
        this._nodes = endpoints.map(endpoint => {
            return new SafeNode({ endpoint })
        })
        this._lowerLayer = lowerLayer
        this._nodeIndex = 0
    }

    /**
     * Try to serve request by routing calling to nodes. If there is a success
     * then return result. If all nodes return error then try lower layer
     * proxy.
     *
     * @param {string} method - Name of method from `SafeNode`.
     * @param {Array<any>} params - List parameters to pass to method.
     */
    async proxy(method, params = []) {
        for (let i = 1; i <= this._nodes.length; ++i) {
            let node = this._pickNode()
            let r = await node[method](...params)
            if (r.error) {
                log.warn('skip', r.errorString(), node.host, r.message)
                continue
            }
            log.info('ok', node.host)
            return r
        }
        if (this._lowerLayer) {
            return this._lowerLayer.proxy(method, params)
        }
        return Result.error(ErrorCode.GATEWAY_BAD_BACKEND)
    }

    /**
     * Do a round robin schedule.
     *
     * @return {Result<SafeNode>}
     */
    _pickNode() {
        if (this._nodes.length === 0) {
            return Result.error(ErrorCode.GATEWAY_NO_BACKEND)
        }
        let node = this._nodes[this._nodeIndex]
        this._nodeIndex = (this._nodeIndex + 1) % this._nodes.length
        return node
    }
}

module.exports = {
    Gateway
}
