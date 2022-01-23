'use strict'

const {Log: StdioLog, Level: LogLevel} = require('stdio_log')
const {
    validateInstanceMap,
    validateInstance,
    validateArrayItems
} = require('minitype')
const {NodeResponse} = require('./node')
const {LogSegment} = require('./safe_node')
const {
    BadError,
    Result,
    UInt64,
    ByteData32,
    EthEndpoint,
    LogFilter,
    Block,
    Transaction
} = require('./type')
const {Gateway} = require('./gateway')

class Client {
    /**
     * @type {StdioLog}
     */
    get log() {
        return this._log
    }

    /**
     * Initialize by {@link Client.create}.
     *
     * @param {object} config
     * @param {Gateway} config.mainGateway
     * @param {StdioLog} config.log
     * @param {Gateway} config.backupGateway
     */
    constructor(config) {
        let {mainGateway, backupGateway, log} = config
        this._layer1 = mainGateway
        this._layer2 = backupGateway
        this._log = log
    }

    /**
     *
     * @param {object} config
     * @param {Array<EthEndpoint>} config.mainEndpoints - List of endpoints that
     * refers to Ethereum nodes.
     * @param {Array<EthEndpoint>} [config.backupEndpoints=[]] - List of
     * endpoints for using in case all `mainEndpoints` is failed.
     * @param {StdioLog} [config.log=StdioLog(LogLevel.ERROR)] - A log writter.
     * @return {Result<TypeError, Client>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['mainEndpoints', Array], ['backupEndpoints', Array, true],
            ['log', StdioLog, true]
        ])
        if (r1.error) {
            return r1
        }
        let {mainEndpoints, backupEndpoints, log} = config
        this._log = log
        backupEndpoints = backupEndpoints || []
        let r2 = Client._validateEndpoints(mainEndpoints, backupEndpoints)
        if (r2.error) {
            return r2
        }
        log = log || new StdioLog(LogLevel.ERROR)
        let mainGateway = Gateway.create({
            endpoints: mainEndpoints,
            log: log
        }).open()
        let backupGateway = Gateway.create({
            endpoints: backupEndpoints,
            log: log
        }).open()
        let data = new Client({mainGateway, backupGateway, log})
        return Result.ok(data)
    }

    /**
     * It is similar to `SafeNode.getBlockNumber()`.
     *
     * @return {Promise<Result<BadError, NodeResponse<UInt64>>>}
     */
    async getBlockNumber() {
        return await this._layer1.proxy('getBlockNumber')
    }

    /**
     * It is similar to `SafeNode.getBlockByNumber()`.
     *
     * @param {UInt64} blockNumber
     * @return {Promise<Result<BadError, NodeResponse<Block>>>}
     */
    async getBlockByNumber(blockNumber) {
        let r1 = validateInstance(blockNumber, UInt64)
        if (r1.error) {
            return r1
        }
        return await this._layer1.proxy('getBlockByNumber', [blockNumber])
    }

    /**
     *
     * @param {ByteData32} hash
     * @return {Promise<Result<BadError, NodeResponse<Transaction>>>}
     */
    async getTransactionByHash(hash) {
        let r1 = validateInstance(hash, ByteData32)
        if (r1.error) {
            return r1
        }
        return await this._layer1.proxy('getTransactionByHash', [hash])
    }

    /**
     * It is similar to `SafeNode.getLogs()`.
     *
     * @param {LogFilter} filter
     * @return {Promise<Result<BadError, NodeResponse<LogSegment>>>}
     */
    async getLogs(filter) {
        let r1 = validateInstance(filter, LogFilter)
        if (r1.error) {
            return r1
        }
        return await this._layer1.proxy('getLogs', [filter])
    }

    /**
     * @private
     * @param {Array<EthEndpoint>} mainEndpoints
     * @param {Array<EthEndpoint>} backupEndpoints
     * @return {Result<TypeError, undefined>}
     */
    static _validateEndpoints(mainEndpoints, backupEndpoints) {
        let r1 = validateArrayItems(mainEndpoints, EthEndpoint, 1)
        if (r1.error) {
            return Result.typeError(`mainEndpoints: ${r1.error.message}`)
        }
        backupEndpoints = backupEndpoints || []
        let r2 = validateArrayItems(backupEndpoints, EthEndpoint)
        if (r2.error) {
            return Result.typeError(`mainEndpoints: ${r2.error.message}`)
        }
        let r3 = EthEndpoint.validateUniqueLists(
            mainEndpoints, backupEndpoints
        )
        if (r3.error) {
            return Result.typeError(
                `mainEndpoints and backupEndpoints: ${r3.error.message}`
            )
        }
        return Result.ok()
    }
}

module.exports = {
    Client
}
