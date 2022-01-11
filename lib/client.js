'use strict'

const {
    ErrorCode,
    ResultError,
    Result,
    UInt64,
    ByteData32,
    Endpoint,
    LogFilter,
    assertObjectAttributes,
    assertInstance,
    assertArray
} = require('./type')
const {Gateway} = require('./gateway')

class Client {
    /**
     *
     * @param {object} config
     * @param {Array<Endpoint>} config.endpoints
     * @param {Array<Endpoint>} [config.backupEndpoints]
     */
    constructor(config) {
        assertObjectAttributes(config, ['endpoints', 'backupEndpoints'])
        let {endpoints, backupEndpoints} = config
        assertArray(endpoints, 'endpoints')
        if (endpoints.length <= 0) {
            throw new ResultError(ErrorCode.TYPE_BAD_SIZE, '>= 1')
        }
        endpoints.forEach((v, i) => {
            assertInstance(v, Endpoint, `endpoints[${i}]`)
        })
        backupEndpoints = backupEndpoints || []
        assertArray(backupEndpoints)
        backupEndpoints.forEach((v, i) => {
            assertInstance(v, Endpoint, `endpoints[${i}]`)
        })
        this._layer2 = new Gateway({
            endpoints: backupEndpoints
        })
        this._layer1 = new Gateway({
            endpoints: endpoints,
            lowerLayer: this._layer2
        })
    }

    /**
     * It is similar to `SafeNode.getBlockNumber()`.
     *
     * @returns {Promise<Result<UInt64, undefined>>}
     */
    async getBlockNumber() {
        return await this._layer1.proxy('getBlockNumber')
    }

    /**
     * It is similar to `SafeNode.getBlockByNumber()`.
     *
     * @param {UInt64} blockNumber
     * @return {Promise<Result<Block, Metadata>>}
     */
    async getBlockByNumber(blockNumber) {
        assertInstance(blockNumber, UInt64)
        return await this._layer1.proxy('getBlockByNumber', [blockNumber])
    }

    /**
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<Transaction, undefined>>}
     */
    async getTransaction(hash) {
        assertInstance(hash, ByteData32)
        return await this._layer1.proxy('getTransaction', [hash])
    }

    /**
     * It is similar to `SafeNode.getLogs()`.
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<Array<Log>, Metadata>>}
     */
    async getLogs(filter) {
        assertInstance(filter, LogFilter)
        return await this._layer1.proxy('getLogs', [filter])
    }
}

module.exports = {
    Client
}
