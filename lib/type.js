'use strict'

/**
 * A number as heximal string, prefixed `0x`.
 *
 * @typedef {string} Heximal
 */

/**
 * Report on any data error, include but not limit: type, format, range.
 */
class DataError extends Error {
    /**
     *
     * @param {string} message
     * @param {Error} originError
     */
    constructor(message, originError=undefined) {
        super(message)
        this.name = 'DataError'
        this._originError = originError
    }

    /**
     * @type {Error}
     */
    get originError() {
        return this._originError
    }

    /**
     *
     * @param {string} message
     * @param {Error} originError
     */
    static throw(message, originError) {
        throw new DataError(message, originError)
    }
}

/**
 * Unsigned 53 bits integer.
 */
class UInt {
    constructor(value) {
        if (!Number.isInteger(value) || value < 0) {
            DataError.throw('not unsigned integer number: value')
        }
        this._value = value
    }

    /**
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {UInt}
     */
    static fromHeximal(value) {
        let number = heximalToNumber(value)
        return new UInt(number)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
     static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof UInt) === false) {
            DataError.throw('not a UInt: ' + hint)
        }
    }
}

/**
 * Unsigned, big integer number.
 */
class UBigInt {
    /**
     *
     * @param {BigInt | number} value - Unsigned, integer number.
     * @throws {DataError}
     */
    constructor(value) {
        if (Number.isInteger(value) && value >= 0) {
            this._value = BigInt(value)
            return
        }
        if (typeof value !== 'bigint' || value >= 0) {
            this._value = BigInt(value)
            return
        }
        DataError.throw('not a unsigned BigInt: value')
    }

    /**
     * @type {BigInt}
     */
    get value() {
        return this._value
    }

    /**
     * @returns {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString(16)
    }

    /**
     *
     * @param {Heximal} value - Heximal string, prefixed `0x`.
     * @returns {UBigInt}
     * @throws {DataError}
     */
    static fromHeximal(value) {
        let number = heximalToBigInt(value)
        return new UBigInt(number)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
     static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof UBigInt) === false) {
            DataError.throw('not a UBigInt: ' + hint)
        }
    }
}

/**
 * Unix timestmap in seconds.
 */
class Timestamp {
    /**
     *
     * @param {number} value - Unix timestamp in seconds.
     * @throws {DataError}
     */
    constructor(value) {
        if (!Number.isInteger(value) || value < 0) {
            DataError.throw('not a unsigned integer: value')
        }
        this._value = value
    }

    /**
     * Unix timestamp in seconds.
     *
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {Timestamp}
     * @throws {DataError}
     */
    static fromHeximal(value) {
        let number = heximalToNumber(value)
        return new Timestamp(number)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof Timestamp) === false) {
            DataError.throw('not a Timestamp: ' + hint)
        }
    }
}

/**
 * Array of bytes as a buffer.
 */
class ByteArray {
    /**
     *
     * @param {Buffer} value
     */
    constructor(value) {
        if ((value instanceof Buffer) === false) {
            DataError.throw('not a buffer: value')
        }
        this._value = value
    }

    /**
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {ByteArray}
     */
    static fromHeximal(value) {
        let buffer = heximalToBuffer(value)
        return new ByteArray(buffer)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof ByteArray) === false) {
            DataError.throw('not a ByteArray: ' + hint)
        }
    }
}

/**
 * ETH address, 20 bytes.
 */
class Address {
    /**
     *
     * @param {Buffer} value
     */
    constructor(value) {
        if (
            (value instanceof Buffer) === false ||
            value.length !== 20
        ) {
            DataError.throw('not a 20 bytes buffer: value')
        }
        this._value = value
    }

    /**
     * 20 bytes buffer as address.
     *
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {Address}
     */
    static fromHeximal(value) {
        if (!isHeximal(value) || value.length !== 42) {
            DataError.throw('not a 20 bytes heximal: value')
        }
        let buffer = heximalToBuffer(value)
        return new Address(buffer)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof Address) === false) {
            DataError.throw('not a Address: ' + hint)
        }
    }
}

/**
 * 32 bytes, has of a block.
 */
class BlockHash {
    /**
     *
     * @param {Buffer} value - 32 bytes buffer.
     */
    constructor(value) {
        if (value.length !== 32) {
            DataError.throw('not a 32 bytes heximal: value')
        }
        this._value = value
    }

    /**
     * 32 bytes buffer.
     *
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {BlockHash}
     */
    static fromHeximal(value) {
        let buffer = heximalToBuffer(value)
        return new BlockHash(buffer)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof BlockHash) === false) {
            DataError.throw('not a BlockHash: ' + hint)
        }
    }
}

/**
 * 32 bytes, hash of a transaction.
 */
class TransactionHash {
    /**
     *
     * @param {Buffer} value - 32 bytes buffer.
     */
    constructor(value) {
        if (value.length !== 32) {
            DataError.throw('not a 32 bytes heximal: value')
        }
        this._value = value
    }

    /**
     * 32 bytes buffer.
     *
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Heximal} value
     * @returns {TransactionHash}
     */
    static fromHeximal(value) {
        let buffer = heximalToBuffer(value)
        return new TransactionHash(buffer)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof TransactionHash) === false) {
            DataError.throw('not a TransactionHash: ' + hint)
        }
    }
}

class Block {
    /**
     *
     * @param {object} value
     * @param {UBigInt} value.number
     * @param {Timestamp} value.timestamp
     * @param {Array<TransactionHash>} value.transactions
     * @
     */
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {number, timestamp, transactions} = value
        if (!UBigInt.isInstance(number)) {
            DataError.throw('not a UBigInt: value.number')
        }
        if (!Timestamp.isInstance(timestamp)) {
            DataError.throw('not a timestamp: value.timestamp')
        }
        if (!Array.isArray(transactions)) {
            DataError.throw('not an array: value.transactions')
        }
        transactions.forEach((item, index) => {
            if (!TransactionHash.isInstance(item)) {
                DataError.throw(
                    `not a transaction hash: value.transactions[${index}]`
                )
            }
        })
        this._number = number
        this._timestamp = timestamp
        this._transactions = transactions
    }

    /**
     * Ordered number of the block.
     *
     * @type {UBigInt}
     */
    get number() {
        return this._number
    }

    /**
     * Timestamp when block is mined.
     *
     * @type {Timestamp}
     */
    get timestamp() {
        return this._timestamp
    }

    /**
     * List of transaction hashes.
     *
     * @type {Array<TransactionHash>}
     */
    get transactions() {
        return this._transactions
    }

    /**
     *
     * @param {any} value
     * @returns {Block}
     */
    static fromRpcResult(value) {
        if (!value) {
            DataError.throw('not an object: value')
        }
        if (!Array.isArray(value.transactions)) {
            DataError.throw('not an array: value.transactions')
        }
        let block = {
            number: UBigInt.fromHeximal(value.number),
            timestamp: Timestamp.fromHeximal(value.timestamp),
            transactions: value.transactions.map(TransactionHash.fromHeximal)
        }
        return new Block(block)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof Block) === false) {
            DataError.throw('not a Block: ' + hint)
        }
    }
}

/**
 * Combination of four ETH topics.
 */
class LogTopicCombination {
    /**
     *
     * @param {Array} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     * @type {Array}
     */
    get values() {
        return this._value
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof LogTopicCombination) === false) {
            DataError.throw('not a LogTopicCombination: ' + hint)
        }
    }
}

/**
 * Specific logs for fetching from a node.
 */
class LogFilter {
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        if (!Array.isArray(value.addresses)) {
            DataError.throw('not an array: value.addresses')
        }
        this._fromBlock = new UInt(value.fromBlock)
        this._toBlock = new UInt(value.toBlock)
        this._addresses = value.addresses.map(Address.fromHeximal)
        this._topics = LogTopicCombination.fromArray(value.topics)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof LogFilter) === false) {
            DataError.throw('not a LogFilter: ' + hint)
        }
    }
}

/**
 * A log record from EVM.
 */
class Log {
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {
            address,
            blockNumber,
            logIndex,
            transactionIndex,
            topics,
            data,
            blockHash,
            transactionHash
        } = value
        Address.assertInstance(address, 'value.address')
        UBigInt.assertInstance(blockNumber, 'value.blockNumber')
        UInt.assertInstance(logIndex, 'value.logIndex')
        UInt.assertInstance(transactionIndex, 'value.transactionIndex')
        LogTopicCombination.assertInstance(topics, 'value.topics')
        BlockHash.assertInstance(blockHash, 'value.blockHash')
        TransactionHash.assertInstance(
            transactionHash,
            'value.transactionHash'
        )
    }

    /**
     *
     * @param {object} value
     * @returns {Log}
     * @throws {DataError}
     */
    static fromRpcResult(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let data = {
            address: Address.fromHeximal(value.address),
            blockNumber: UBigInt.fromHeximal(value.blockNumber),
            logIndex: UInt.fromHeximal(value.logIndex),
            transactionIndex: UInt.fromHeximal(value.transactionIndex),
            topics: LogTopicCombination.fromRpcResult(value.topics),
            data: ByteArray.fromHeximal(data),
            blockHash: BlockHash.fromHeximal(value.blockHash),
            transactionHash: TransactionHash.fromHeximal(value.transactionHash)
        }
        return new Log(data)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint='oops!, no more information') {
        if ((value instanceof Log) === false) {
            DataError.throw('not a Log: ' + hint)
        }
    }
}

/**
 *
 * @param {any} value
 * @returns {boolean}
 */
function isHeximal(value) {
    return /^0x[a-fA-F0-9]+$/.test(value)
}

/**
 * @param {any} value
 * @returns {number}
 * @throws {DataError}
 */
function heximalToNumber(value) {
    if (!isHeximal(value)) {
        DataError.throw('not a heximal: value')
    }
    let number = BigInt(value)
    if (number > Number.MAX_SAFE_INTEGER) {
        DataError.throw('overflow native Javascript integer number: value')
    }
    return Number(number)
}

/**
 *
 * @param {any} value
 * @returns {BigInt}
 * @throws {DataError}
 */
function heximalToBigInt(value) {
    if (!isHeximal(value)) {
        DataError.throw('not a heximal: value')
    }
    return BigInt(value)
}

/**
 *
 * @param {any} value
 * @returns {Buffer}
 * @throws {DataError}
 */
function heximalToBuffer(value) {
    if (!isHeximal(value)) {
        DataError.throw('not a heximal: vavlue')
    }
    let evenLength = (value.length % 2) === 0
    let evenHeximal = evenLength
        ? value.slice(2)
        : '0x' + value.slice(2)
    return Buffer.from(evenHeximal, 'hex')
}

module.exports = {
    DataError,
    UBigInt,
    Timestamp,
    TransactionHash,
    Block,
    LogFilter,
    Log
}
