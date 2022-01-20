'use strict'

const {Interface, LogDescription} = require('@ethersproject/abi')
const {ByteData32, Log} = require('./type')

/**
 * Encode and decode data from [ETH JSON RPC](https://eth.wiki/json-rpc/API).
 * This class is a wrapper of
 * [ethers.Interface](https://docs.ethers.io/v5/api/utils/abi/interface/).
 *
 * @example
 * let abi = require('abi.json')
 * let codec = new Codec(abi)
 *
 * // Retrieve topic for filtering logs.
 * let topic = codec.getEventTopic(eventName)
 *
 * // Retrieve data from a log.
 * let data = codec.parseLog(log)
 */
class Codec {
    /**
     *
     * @param {any} abi - Specifications of public methods and it's parameters
     * from a contract.
     */
    constructor(abi) {
        this._interface = new Interface(abi)
    }

    /**
     * @param {string} eventName
     * @return {ByteData32}
     */
    getEventTopic(eventName) {
        let heximalTopic = this._interface.getEventTopic(eventName)
        return ByteData32.fromHeximal(heximalTopic).open()
    }

    /**
     *
     * @param {Log} log
     * @return {LogDescription}
     */
    parseLog(log) {
        return this._interface.parseLog({
            data: log.data.value,
            topics: log.topics.toHeximalArray()
        })
    }
}

module.exports = {
    Codec
}
