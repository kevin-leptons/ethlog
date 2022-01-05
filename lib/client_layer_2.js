'use strict'

const {DataError} = require('./type')
const {ClientLayer3} = require('./client_layer_3')
const {Gateway} = require('./gateway')

class ClientLayer2 {
    /**
     *
     * @param {Config} config
     * @param {Array<HttpEndpoint>} config.endpoints
     * @param {ClientLayer3} config.lowerLayer
     */
     constructor(config) {
        assertObject(config, 'config')
        let {endpoints, lowerLayer} = config
        assertArray(endpoints, 'config.endpoints')
        endpoints.forEach((item, index) => {
            HttpEndpoint.assertInstance(item, `config.endpoints[${index}]`)
        })
        if (lowerLayer instanceof ClientLayer3) {
            DataError.throw('not a ClientLayer3: config.lowerLayer')
        }
        this._lowerLayer = lowerLayer
        this._gateway = new Gateway({endpoints})
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Promise<LogSegment>}
     * @throws {DataError}
     */
     async getLogs(filter) {
         try {
             let node = this._gateway.pick()
             return await node.getLogs(filter)
         }
         catch (error) {
             return await this._lowerLayer.getLogs(filter)
         }
     }
}

module.exports = {
    ClientLayer2
}
