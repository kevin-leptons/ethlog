'use strict'

const {
    HttpEndpoint,
    LogFilter,
    LogSegment,
    assertObject,
    assertArray
} = require('./type')
const {ClientLayer1} = require('./client_layer_1')
const {ClientLayer2} = require('./client_layer_2')
const {ClientLayer3} = require('./client_layer_3')

class Client {
    /**
     *
     * @param {object} config
     * @param {Array<HttpEndpoint>} config.mainEndpoints
     * @param {Array<HttpEndpoint>} [config.publicEndpoints]
     * @param {Array<HttpEndpoint>} [config.backupEndpoints]
     */
    constructor(config) {
        assertObject(config, 'config')
        let {mainEndpoints, publicEndpoints, backupEndpoints} = config
        assertArray(mainEndpoints)
        mainEndpoints.forEach((item, index) => {
            HttpEndpoint.assertInstance(item, `config.mainEndpoints[${index}]`)
        })
        publicEndpoints = publicEndpoints || []
        assertArray(publicEndpoints)
        publicEndpoints.forEach((item, index) => {
            HttpEndpoint.assertInstance(item, `config.publicEndpoints[${index}]`)
        })
        backupEndpoints = backupEndpoints || []
        assertArray(backupEndpoints)
        backupEndpoints.forEach((item, index) => {
            HttpEndpoint.assertInstance(item, `config.backupEndpoints[${index}]`)
        })
        this._layer3 = new ClientLayer3({
            endpoints: backupEndpoints
        })
        this._layer2 = new ClientLayer2({
            endpoints: mainEndpoints,
            lowerLayer: this._layer3
        })
        this._layer1 = new ClientLayer1({
            endpoints: publicEndpoints,
            lowerLayer: this._layer2
        })
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Promise<LogSegment>}
     * @throws {DataError}
     */
    async getLogs(filter) {
        return await this._layer1.getLogs(filter)
    }
}

module.exports = Client
