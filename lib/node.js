'use strict'

const axios = require('axios')
const {
    DataError,
    RpcError,
    UBigInt,
    Block,
    LogFilter,
} = require('./type')
const {
    isUnsignedInteger,
    isTransactionHashHeximal
} = require('./validator')
const {
    numberToHeximal,
    heximalToNumber,
} = require('./formatter')

/**
 * @typedef {object} NodeConfig
 * @property {UnsignedInteger} identity
 * @property {HttpUrl} [endpoint='http://localhost:8545']
 * @property {UnsignedInteger} [weight=1] - It is use for evalution and
 * distribution requests between nodes. The greater weight, the more
 * requests is dispatch to this node.
 */

class Node {
    /**
     *
     * @param {NodeConfig} config
     */
    constructor(config) {
        let validConfig = standardizeConfig(config)

        this._identity = validConfig.identity
        this._weight = validConfig.weight
        this._httpClient = axios.create({
            baseURL: validConfig.endpoint
        })
    }

    /**
     * @returns {Promise<UBigInt>}
     */
    async getBlockNumber() {
        let result = await this._requestJsonRpc('eth_blockNumber', [])
        return UBigInt.fromHeximal(result)
    }

    /**
     *
     * @param {LogFilter} filter
     * @returns {Promise<Array<Log>>}
     */
    async getLogs(filter) {
        LogFilter.assertInstance(filter, 'not a log filter: filter')
        let rpcFilter = filter.toRpcInput()
        let logs = await this._requestJsonRpc('eth_getLogs', [rpcFilter])

        logs.forEach(formatLogInplace)

        return logs
    }

    /**
     *
     * @param {UBigInt} blockNumber
     * @returns {Promise<Block>}
     */
    async getBlockByNumber(blockNumber) {
        UBigInt.assertInstance(blockNumber, 'blockNumber')
        let blockNumberHeximal = blockNumber.toHeximal()
        let result = await this._requestJsonRpc(
            'eth_getBlockByNumber',
            [blockNumberHeximal, false]
        )
        return Block.fromRpcResult(result)
    }

    /**
     * Retrieve a transaction by it's hash.
     * It is equivalent to RPC `eth_getTransactionByHash`.
     *
     * @param {TransactionHashHeximal} hash
     * @returns {Transaction | undefined}
     * @throws {ClientError}
     */
    async getTransactionByHash(hash) {
        if (!isTransactionHashHeximal(hash)) {
            throw new EthLogError('not a transaction hash heximal')
        }
        let transaction = await this._requestJsonRpc(
            'eth_getTransactionByHash',
            [hash]
        )
        formatTransactionInplace(transaction)
        return transaction
    }

    /**
     *
     * @param {string} method
     * @param {any} params
     * @returns {Promise<any>}
     */
    async _requestJsonRpc(method, params) {
        let response = await this._httpClient.post('/', {
            id: 0,
            jsonrpc: '2.0',
            method: method,
            params: params
        })
        let {error, result} = response.data

        if (error) {
            throw new RpcError(method, error)
        }

        return result
    }
}

/**
 *
 * @param {any} config
 * @returns {NodeConfig}
 */
function standardizeConfig(config) {
    if (!isUnsignedInteger(config.identity)) {
        throw new NodeError('invalid identity')
    }

    let defaultConfig = {
        endpoint: 'http://localhost:8545',
        weight: 1
    }

    return Object.assign(defaultConfig, config)
}

/**
 * @private
 * @param {any} filter
 * @returns {RpcLogFilter}
 */
function toRpcLogfilter(filter) {
    return {
        address: filter.addresses,
        fromBlock: numberToHeximal(filter.fromBlock),
        toBlock: numberToHeximal(filter.toBlock),
        topics: filter.topics
    }
}

/**
 * @private
 * @param {any} log
 * @returns {Log}
 */
function formatLogInplace(log) {
    log.blockNumber = heximalToNumber(log.blockNumber)
    log.logIndex = heximalToNumber(log.logIndex)
    log.transactionIndex = heximalToNumber(log.transactionIndex)
}

/**
 * Convert data type of attributes inplace.
 *
 * @private
 * @param {any} tx
 */
function formatTransactionInplace(tx) {
    tx.blockNumber = heximalToNumber(tx.blockNumber)
    tx.transactionIndex = heximalToNumber(tx.transactionIndex)
    tx.type = heximalToNumber(tx.type)
    tx.nonce = heximalToNumber(tx.nonce)
    tx.gas = BigInt(tx.gas)
    tx.gasPrice = BigInt(tx.gasPrice)
}

module.exports = {
    Node
}
