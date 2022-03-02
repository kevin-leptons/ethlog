'use strict'

const fs = require('fs')
const {Result, validateInstance} = require('minitype')
const {Interface, LogDescription} = require('@ethersproject/abi')
const {Heximal, ByteData32, Log} = require('./type')

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
     * Initialize by {@link Abi.create} and {@link Abi.fromJsonFile}.
     *
     * @param {any} abi - Specifications of public methods and it's parameters
     * from a contract.
     */
    constructor(abi) {
        this._interface = new Interface(abi)
    }

    /**
     *
     * @param {Array} abi - Application Binary Interface of the contract.
     * @return {Result<TypeError, Codec>}
     */
    static create(abi) {
        let r1 = validateInstance(abi, Array)
        if (r1.error) {
            return Result.typeError(`abi: ${r1.error.message}`)
        }
        let instance = new Codec(abi)
        return Result.ok(instance)
    }

    /**
     *
     * @param {string} filePath - Path to file that contains ABI as JSON data.
     * @return {Result<TypeError | Error, Codec>}
     */
    static fromJsonFile(filePath) {
        let r1 = validateInstance(filePath, 'string')
        if (r1.error) {
            return Result.typeError(`filePath: ${r1.error.message}`)
        }
        let r2 = Codec._readJsonFile(filePath)
        if (r2.error) {
            return r2
        }
        let r3 = Codec._parseJson(r2.data)
        if (r3.error) {
            return Result.typeError(`file ${filePath}: ${r3.error.message}`)
        }
        let {data: abi} = r3
        let r4 = validateInstance(abi, Array)
        if (r4.error) {
            return Result.typeError(`file ${filePath}: ${r4.error.message}`)
        }
        let instance = new Codec(abi)
        return Result.ok(instance)
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

    /**
     *
     * @param {string} method
     * @param {Array} data
     * @return {Heximal}
     */
    encodeFunctionData(method, data) {
        try {
            let encoded = this._interface.encodeFunctionData(method, data)
            return Result.ok(encoded)
        }
        catch (error) {
            return Result.error(error)
        }
    }

    /**
     *
     * @param {string} method
     * @param {Heximal} data
     * @return {Result<Error, any>}
     */
    decodeFunctionResult(method, data) {
        try {
            let decoded = this._interface.decodeFunctionResult(method, data)
            return Result.ok(decoded)
        }
        catch (error) {
            return Result.error(error)
        }
    }

    /**
     * @private
     * @param {string} filePath
     * @return {Result<Error, any>}
     */
    static _readJsonFile(filePath) {
        try {
            let data = fs.readFileSync(filePath, 'utf-8')
            return Result.ok(data)
        }
        catch (error) {
            return Result.error(error)
        }
    }

    /**
     * @private
     * @param {string} value
     * @return {Result<Error, any>}
     */
    static _parseJson(value) {
        try {
            let data = JSON.parse(value)
            return Result.ok(data)
        }
        catch (error) {
            return Result.typeError('expect JSON format')
        }
    }
}

module.exports = {
    Codec
}
