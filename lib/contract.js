'use strict'

const {validateInstance} = require('minitype')
const {Codec} = require('./codec')
const {Client} = require('./client')
const {Result, Address, UInt64, Heximal} = require('./type')

/**
 * Interact with specific contract.
 *
 * @example
 * let address = Address.fromHeximal(...).open()
 * let client = Client.create(...).open()
 * let codec = Codec.fromJsonFile(...).open()
 * let contract = Contract.create(address, codec, client)
 * contract.call('decimals')
 */
class Contract {
    /**
     * Initialize by {@link Contract.create}.
     *
     * @param {Address} address - Address of the contract.
     * @param {Codec} codec - Decoder for input/output data to the contract.
     * @param {Client} client - An interface for interacting to Ethereum
     * node.
     */
    constructor(address, codec, client) {
        this._addressHeximal = address.toHeximal()
        this._codec = codec
        this._client = client
    }

    /**
     *
     * @param {address} address - Address of the contract.
     * @param {Codec} codec - Decoder for input/output data to the contract.
     * @param {Client} client - An interface for interacting with Ethereum.
     * @return {Result<TypeError, Contract>}
     */
    static create(address, codec, client) {
        let r1 = validateInstance(address, Address)
        if (r1.error) {
            return Result.typeError(`address: ${r1.error.message}`)
        }
        let r2 = validateInstance(codec, Codec)
        if (r2.error) {
            return Result.typeError(`codec: ${r2.error.message}`)
        }
        let r3 = validateInstance(client, Client)
        if (r3.error) {
            return Result.typeError(`client: ${r3.error.message}`)
        }
        let instance = new Contract(address, codec, client)
        return Result.ok(instance)
    }

    /**
     * Call specific method on the contract.
     *
     * @param {string} method - Method to be call.
     * @param {Array} data - Positional arguments which is pass to method.
     * @param {UInt64} blockNumber - A milestone where data exists.
     * Special value `latest` point to greatest block number.
     * @return {Promise<Result<TypeError, any>>}
     */
    async call(method, data = [], blockNumber = 'latest') {
        let r1 = validateInstance(method, 'string')
        if (r1.error) {
            return Result.typeError(`method: ${r1.error.message}`)
        }
        let r2 = validateInstance(data, Array)
        if (r2.error) {
            return Result.typeError(`data: ${r2.error.message}`)
        }
        let r3 = Contract._toBlockNumber(blockNumber)
        if (r3.error) {
            return Result.typeError(`blockNumber: ${r3.error.message}`)
        }
        let r4 = this._codec.encodeFunctionData(method, data)
        if (r4.error) {
            return Result.typeError(`data: ${r4.error.message}`)
        }
        let {data: rpcBlockNumber} = r3
        let {data: encodedData} = r4
        let params = [
            {
                to: this._addressHeximal,
                data: encodedData
            },
            rpcBlockNumber
        ]
        let r5 = await this._client.call('eth_call', params)
        if (r5.error) {
            return r5
        }
        return this._codec.decodeFunctionResult(method, r5.data.data)
    }

    /**
     *
     * @param {UInt64} value - There is special value `latest`.
     * @return {Heximal} - There is special case `latest.
     */
    static _toBlockNumber(value) {
        if (value === 'latest') {
            return Result.ok(value)
        }
        let r1 = validateInstance(value, UInt64)
        if (r1.error) {
            return r1
        }
        return Result.ok(value.toHeximal())
    }
}

module.exports = {
    Contract
}
