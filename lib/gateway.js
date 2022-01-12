'use strict'

const {Log: StdioLog} = require('stdio_log')
const {
    ErrorCode,
    Result,
    Endpoint,
    assertObjectAttributes,
    assertInstance,
    assertOptionalInstance,
    assertArray
} = require('./type')
const {SafeNode} = require('./safe_node')

class Gateway {
    /**
     *
     * @param {object} config
     * @param {Array<Endpoint>} config.endpoints
     * @param {StdioLog} config.log
     * @param {Gateway} [config.lowerLayer]
     */
    constructor(config) {
        assertObjectAttributes(config, [
            'endpoints', 'lowerLayer', 'log'
        ])
        let {endpoints, lowerLayer, log} = config
        assertArray(endpoints)
        endpoints.forEach((v, i) => {
            assertInstance(v, Endpoint, `endpoints[${i}]`)
        })
        assertInstance(log, StdioLog, 'log')
        assertOptionalInstance(lowerLayer, Gateway, 'lowerLayer')
        this._nodes = endpoints.map(endpoint => {
            return new SafeNode({endpoint, log})
        })
        this._lowerLayer = lowerLayer
        this._log = log
        this._nodeIndex = 0
    }

    /**
     * Try to serve request by routing calling to nodes. If there is a success
     * then return result. If all nodes return error then try lower layer
     * proxy.
     *
     * @param {string} method - Name of method from `SafeNode`.
     * @param {Array<any>} params - List parameters to pass to method.
     * @return {Promise<Result>}
     */
    async proxy(method, params = []) {
        for (let i = 1; i <= this._nodes.length; ++i) {
            let node = this._pickNode()
            this._log.info('call', method, node.host, '...')
            let r = await node[method](...params)
            if (r.error) {
                this._log.warn('skip', r.errorString(), node.host, r.message)
                continue
            }
            this._log.info('ok', node.host)
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
     * @private
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
