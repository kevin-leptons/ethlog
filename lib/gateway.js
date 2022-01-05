'use strict'

const {
    HttpEndpoint,
    assertObject,
    assertArray
} = require('./type')
const {Node} = require('./node')

class UnavailableNodeError extends Error {
    constructor(message) {
        super(message)
        this.name = 'UnavailableNodeError'
    }
}

class Gateway {
    /**
     *
     * @param {object} config
     * @param {Array<HttpEndpoint>} config.endpoints
     */
    constructor(config) {
        assertObject(config, 'config')
        let {endpoints} = config
        assertArray(endpoints, 'config.endpoints')
        this._endpoints = endpoints
    }

    /**
     * @returns {Node}
     * @throws {UnavailableNodeError}
     */
    pick() {}
}

module.exports = {
    UnavailableNodeError,
    Gateway
}
