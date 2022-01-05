'use strict'

const ASSERT_DEFAULT_HINT = 'oops!, no more information'

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
    constructor(message, originError = undefined) {
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
     * @throws {DataError}
     */
    static throw(message, originError) {
        throw new DataError(message, originError)
    }
}

class RpcError extends Error {
    /**
     *
     * @param {string} message
     * @param {Error} originError
     */
    constructor(message, originError = undefined) {
        super(message)
        this.name = 'RpcError'
        this._originError = originError
    }

    /**
     * @type {Error}
     */
    get originError() {
        return this._originError
    }
}

/**
 * Unsigned 53 bits integer.
 */
class UInt {
    constructor(value) {
        if (!Number.isInteger(value) || value < 0) {
            DataError.throw('not a unsigned integer number: value')
        }
        if (value > Number.MAX_SAFE_INTEGER) {
            DataError.throw('overflow 53 bits unsigned integer number: value')
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
     * @param {bigint | number} value - Unsigned, integer number.
     * @throws {DataError}
     */
    constructor(value) {
        if (Number.isInteger(value) && value >= 0) {
            this._value = BigInt(value)
            return
        }
        if (typeof value === 'bigint' && value >= 0) {
            this._value = BigInt(value)
            return
        }
        DataError.throw('not a unsigned BigInt: value')
    }

    /**
     * @type {bigint}
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
            DataError.throw('not a unsigned integer number: value')
        }
        if (value > Number.MAX_SAFE_INTEGER) {
            DataError.throw('overflow 53 bits unsigned integer number: value')
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof ByteArray) === false) {
            DataError.throw('not a ByteArray: ' + hint)
        }
    }
}

/**
 * HTTP URL has no creadential such as username and password.
 */
class SafeHttpUrl {
    /**
     *
     * @param {string} value
     * @throws {DataError}
     */
    constructor(value) {
        let url = SafeHttpUrl._parseUrl(value)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            DataError.throw('must be protocol http or https: value')
        }
        if (url.username || url.password) {
            DataError.throw('must not contains username or password: value')
        }
        this._value = value
    }

    /**
     * @type {string}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {string} value
     * @returns {URL}
     * @throws {DataError}
     */
    static _parseUrl(value) {
        try {
            return new URL(value)
        }
        catch (error) {
            DataError.throw('invalid URL: value', error)
        }
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof SafeHttpUrl) === false) {
            DataError.throw('not a SafeHttpUrl: ' + hint)
        }
    }
}

/**
 * HTTP endpoint for query and load balancing.
 */
class HttpEndpoint {
    /**
     *
     * @param {object} config
     * @param {SafeHttpUrl} config.url
     * @param {UInt} [config.weight]
     * @param {string} [config.username]
     * @param {string} [config.password]
     */
    constructor(config) {
        if (typeof config !== 'object') {
            DataError.throw('not an object: config')
        }
        let {url, weight, username, password} = config
        SafeHttpUrl.assertInstance(url, 'config.url')
        weight = weight || new UInt(1)
        UInt.assertInstance(weight, 'config.weight')
        if (!isOptionalString(username)) {
            DataError.throw('not a optional string: config.username')
        }
        if (!isOptionalString(password)) {
            DataError.throw('not a optional string: config.password')
        }
        this._url = url
        this._weight = weight
        this._username = username
        this._password = password
    }

    /**
     * @type {SafeHttpUrl}
     */
    get url() {
        return this._url
    }

    /**
     * @type {UInt}
     */
    get weight() {
        return this._weight
    }

    /**
     * @type {string | undefined}
     */
    get username() {
        return this._username
    }

    /**
     * @type {string | undefined}
     */
    get password() {
        return this._password
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof HttpEndpoint) === false) {
            DataError.throw('not a HttpEndpoint: ' + hint)
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

    toHeximal() {
        return '0x' + this._value.toString('hex')
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
     */
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {number, timestamp, transactions} = value
        UBigInt.assertInstance(number, 'value.number')
        Timestamp.assertInstance(timestamp, 'value.timestamp')
        if (!Array.isArray(transactions)) {
            DataError.throw('not an array: value.transactions')
        }
        transactions.forEach((item, index) => {
            TransactionHash.assertInstance(
                item,
                `value.transactions[${index}]`
            )
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof Block) === false) {
            DataError.throw('not a Block: ' + hint)
        }
    }
}

/**
 * 32 bytes buffer as a log topic.
 */
class LogTopic {
    /**
     * @param {Buffer} buffer - 32 bytes buffer.
     * @throws {DataError}
     */
    constructor(buffer) {
        if (buffer.length !== 32) {
            DataError.throw('not a 32 bytes heximal')
        }
        this._value = buffer
    }

    /**
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @returns {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString('hex')
    }

    /**
     *
     * @param {Heximal} value - 32 bytes heximal.
     * @returns {LogTopic}
     * @throws {DataError}
     */
    static fromHeximal(value) {
        let buffer = heximalToBuffer(value)
        return new LogTopic(buffer)
    }
}

/**
 * Combination of four ETH topics.
 */
class LogTopicCombination {
    /**
     *
     * @param {Array<LogTopic | Array<LogTopic>>} value
     */
    constructor(value = []) {
        assertArray(value, 'value')
        if (value.length > 4) {
            DataError.throw('too many items, maximum is 4: value')
        }
        value.forEach((item, index) => {
            LogTopicCombination._assertArrayOrTopic(
                item,
                `value[${index}]`
            )
        })
        this._value = value
    }

    /**
     * @type {Array<LogTopic | Array<LogTopic>>}
     */
    get value() {
        return this._value
    }

    /**
     * @returns {Array<Heximal | Array<Heximal>>}
     */
    toRpcInput() {
        return this._value.map(item => {
            if (item instanceof LogTopic) {
                return item.toHeximal()
            }
            else {
                return item.map(child => child.toHeximal())
            }
        })
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof LogTopicCombination) === false) {
            DataError.throw('not a LogTopicCombination: ' + hint)
        }
    }

    /**
     *
     * @param {LogTopic | Array<LogTopic>} value
     * @param {string} hint
     * @throws {DataError}
     */
    static _assertArrayOrTopic(value, hint) {
        if (value instanceof LogTopic) {
            return
        }
        if (LogTopicCombination._isTopicArray(value)) {
            return
        }
        DataError.throw(`not a topic or array of topics: ${hint}`)
    }

    /**
     *
     * @param {Array<LogTopic>} value
     * @returns {boolean}
     */
    static _isTopicArray(value) {
        if (!Array.isArray(value)) {
            return false
        }
        for (let item of value) {
            if ((item instanceof LogTopic) === false) {
                return false
            }
        }
        return true
    }
}

/**
 * Specific logs for fetching from a node.
 */
class LogFilter {
    /**
     *
     * @param {object} value
     * @param {Array<Address>} value.addresses
     */
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {fromBlock, toBlock, addresses, topics} = value
        UBigInt.assertInstance(fromBlock, 'value.fromBlock')
        UBigInt.assertInstance(toBlock, 'value.toBlock')
        if (!Array.isArray(addresses)) {
            DataError.throw('not an array: value.addresses')
        }
        if (fromBlock.value > toBlock.value) {
            DataError.throw('value.fromBlock must be <= value.toBlock')
        }
        addresses.forEach((item, index) => {
            Address.assertInstance(
                item,
                `not a address: value.addresses[${index}]`
            )
        })
        topics = topics || new LogTopicCombination()
        LogTopicCombination.assertInstance(topics, 'value.topics')
        this._fromBlock = fromBlock
        this._toBlock = toBlock
        this._addresses = addresses
        this._topics = topics
    }

    /**
     * @returns {object}
     */
    toRpcInput() {
        return {
            fromBlock: this._fromBlock.toHeximal(),
            toBlock: this._toBlock.toHeximal(),
            address: this._addresses.map(item => item.toHeximal()),
            topics: this._topics.toRpcInput()
        }
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
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
        ByteArray.assertInstance(data, 'value.data')
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
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof Log) === false) {
            DataError.throw('not a Log: ' + hint)
        }
    }
}

/**
 * Indicate a log segment, include: logs and additional information.
 */
class LogSegment {
    /**
     *
     * @param {Array<Log>} logs
     * @param {UBigInt} confirmedBlockNumber - The log segment ensures
     * correctness of `logs` in range `[filter.fromBlock, confirmedBlock]`.
     * It does not contain logs from remain range
     * `(confirmedBlock, filter.toBlock)`.
     */
    constructor(logs, confirmedBlockNumber) {
        if (!Array.isArray(logs)) {
            DataError.throw('not an array: logs')
        }
        logs.forEach((item, index) => {
            Log.assertInstance(item, `not a log: logs[${index}]`)
        })
        UBigInt.assertInstance(
            confirmedBlockNumber,
            'not a unsigned big integer number: confirmedBlockNumber'
        )
        if (
            logs.length > 0 &&
            logs[0].blockNumber.value > confirmedBlockNumber.value
        ) {
            DataError.throw('confirmedBlock is less than last block number')
        }
        this._logs = logs
        this._confirmedBlockNumber = confirmedBlockNumber
    }

    /**
     * @type {Array<Log>}
     */
    get logs() {
        return this._logs
    }

    /**
     * @type {UBigInt}
     */
    get confirmedBlockNumber() {
        return this._confirmedBlockNumber
    }
}

/**
 *
 * @param {any} value
 * @param {string} [hint]
 * @throws {DataError}
 */
function assertObject(value, hint = ASSERT_DEFAULT_HINT) {
    if (typeof value !== 'object') {
        DataError.throw('not an object: ' + hint)
    }
}

/**
 *
 * @param {any} value
 * @param {string} hint
 * @throws {DataError}
 */
function assertArray(value, hint = ASSERT_DEFAULT_HINT) {
    if (!Array.isArray(value)) {
        DataError.throw('not an array: ' + hint)
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
 *
 * @param {string | undefined} value
 * @returns {boolean}
 */
function isOptionalString(value) {
    return (value === undefined) || (typeof value === 'string')
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
        DataError.throw('overflow 53 bits integer number: value')
    }
    return Number(number)
}

/**
 *
 * @param {any} value
 * @returns {bigint}
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
    ASSERT_DEFAULT_HINT,
    DataError,
    RpcError,
    UInt,
    UBigInt,
    Timestamp,
    SafeHttpUrl,
    HttpEndpoint,
    TransactionHash,
    Address,
    Block,
    LogTopic,
    LogTopicCombination,
    LogFilter,
    Log,
    LogSegment,
    assertObject,
    assertArray
}
