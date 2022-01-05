'use strict'

const {
    DataError,
    HttpEndpoint,
    assertObject,
    assertArray
} = require('./type')
const {UnavailableNodeError, Gateway} = require('./gateway')

class ClientLayer3 {
    /**
     *
     * @param {Config} config
     * @param {Array<HttpEndpoint>} config.endpoints
     */
    constructor(config) {
        assertObject(config, 'config')
        let {endpoints} = config
        assertArray(endpoints, 'config.endpoints')
        endpoints.forEach((item, index) => {
            HttpEndpoint.assertInstance(item, `config.endpoints[${index}]`)
        })
        this._gateway = new Gateway(endpoints)
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Promise<LogSegment>}
     * @throws {DataError | UnavailableNodeError}
     */
    async getLogs(filter) {
        let node = this._gateway.pick()
        return await node.getLogs(filter)
    }
}

module.exports = {
    ClientLayer3
}
