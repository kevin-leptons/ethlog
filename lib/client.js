'use strict'

const {Log: StdioLog} = require('stdio_log')
const {Metadata} = require('./safe_node')
const {
    ErrorCode,
    ResultError,
    Result,
    UInt64,
    ByteData32,
    EthEndpoint,
    LogFilter,
    Log,
    Block,
    LogLevel,
    assertObjectAttributes,
    assertInstance,
    assertArray
} = require('./type')
const {Gateway} = require('./gateway')

class Client {
    /**
     *
     * @param {object} config
     * @param {Array<EthEndpoint>} config.mainEndpoints
     * @param {Array<EthEndpoint>} [config.backupEndpoints]
     * @param {StdioLog} [config.logLevel]
     */
    constructor(config) {
        assertObjectAttributes(config, [
            'mainEndpoints', 'backupEndpoints', 'logLevel'
        ])
        let {mainEndpoints, backupEndpoints, logLevel} = config
        assertArray(mainEndpoints, 'endpoints')
        if (mainEndpoints.length <= 0) {
            throw new ResultError(ErrorCode.TYPE_BAD_SIZE, '>= 1')
        }
        mainEndpoints.forEach((v, i) => {
            assertInstance(v, EthEndpoint, `endpoints[${i}]`)
        })
        backupEndpoints = backupEndpoints || []
        assertArray(backupEndpoints)
        backupEndpoints.forEach((v, i) => {
            assertInstance(v, EthEndpoint, `endpoints[${i}]`)
        })
        LogLevel.assertOptional(logLevel, 'logLevel')
        let log = new StdioLog(logLevel)
        this._layer2 = new Gateway({
            endpoints: backupEndpoints,
            log: log
        })
        this._layer1 = new Gateway({
            endpoints: mainEndpoints,
            lowerLayer: this._layer2,
            log: log
        })
    }

    /**
     * It is similar to `SafeNode.getBlockNumber()`.
     *
     * @return {Promise<Result<UInt64, undefined>>}
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
     * @return {Promise<Result<ByteData32, undefined>>}
     */
    async getTransactionByHash(hash) {
        assertInstance(hash, ByteData32)
        return await this._layer1.proxy('getTransactionByHash', [hash])
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
