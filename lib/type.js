'use strict'

const ASSERT_DEFAULT_HINT = 'oops!, no more information'

/**
 * A heximal string, prefixed `0x`.
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
     * @param {Error} cause
     */
    constructor(message, cause = undefined) {
        super(message)
        this.name = 'DataError'
        this._cause = cause
    }

    /**
     * @type {Error | undefined}
     */
    get cause() {
        return this._cause
    }

    /**
     * Shortcut to throw error tranditional way `throw new Error()`.
     *
     * @param {string} message
     * @param {Error} cause
     * @throws {DataError}
     */
    static throw(message, cause = undefined) {
        throw new DataError(message, cause)
    }
}

/**
 * An object is not existed such as block, transaction.
 */
class NotExistedError extends Error {
    /**
     *
     * @param {string} kind - Object classify.
     * @param {string} identity
     */
    constructor(kind, identity) {
        super(kind + ': ' + identity)
        this.name = 'NotExistedError'
        this._kind = kind
        this._identity = identity
    }

    /**
     * @type {string}
     */
    get kind() {
        return this._kind
    }

    /**
     * @type {string}
     */
    get identity() {
        return this._identity
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
 * Unsigned, integer number, 16 bits.
 */
class UInt16 {
    /**
     *
     * @param {number} value
     * @throws {DataError}
     */
    constructor(value) {
        if (!Number.isInteger(value) || value < 0) {
            DataError.throw('not a unsigned integer number: value')
        }
        if (value > 65535) {
            DataError.throw('overflow 16 bits unsigned integer number: value')
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
     * @returns {UInt16}
     * @throws {DataError}
     */
    static fromHeximal(value) {
        let number = heximalToNumber(value)
        return new UInt16(number)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof UInt16) === false) {
            DataError.throw('not a UInt16: ' + hint)
        }
    }
}

/**
 * Unsigned, big integer number.
 */
class BigUInt {
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
     * @returns {BigUInt}
     * @throws {DataError}
     */
    static fromHeximal(value) {
        let number = heximalToBigInt(value)
        return new BigUInt(number)
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof BigUInt) === false) {
            DataError.throw('not a BigUInt: ' + hint)
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
     * Deal with heximal `0x`, consider it is empty byte array.
     * Although RPC specification disallows this format, the implementations
     * keep returns it somehow.
     * See [HEX value encoding](https://eth.wiki/json-rpc/API)
     * for more details.
     *
     * @param {Heximal | '0x'} value
     * @returns {ByteArray}
     */
    static fromBadHeximal(value) {
        if (value === '0x') {
            return new ByteArray(
                Buffer.from([])
            )
        }
        return ByteArray.fromHeximal(value)
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
class HttpUrl {
    /**
     *
     * @param {string} value
     * @throws {DataError}
     */
    constructor(value) {
        let url = HttpUrl._parseUrl(value)
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
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof HttpUrl) === false) {
            DataError.throw('not a HttpUrl: ' + hint)
        }
    }

    /**
     * @private
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
}

/**
 * Information to interact with HTTP such as URL, authentication.
 */
class HttpEndpoint {
    /**
     *
     * @param {object} config
     * @param {HttpUrl} config.url
     * @param {string} [config.username]
     * @param {string} [config.password]
     */
    constructor(config) {
        assertObject(config, 'config')
        let {url, username, password} = config
        HttpUrl.assertInstance(url, 'config.url')
        assertOptionalString(username, 'config.username')
        assertOptionalString(password, 'config.password')
        this._url = url
        this._username = username
        this._password = password
    }

    /**
     * @type {HttpUrl}
     */
    get url() {
        return this._url
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
 * Specific limits of a endpoint.
 */
class EndpointQuota {
    /**
     *
     * @param {object} value
     * @param {UInt} [value.rateLimit] - Maximum allowed number of requests per
     * second. Dese not specify mean no limit.
     * @param {UInt} [value.batchLimit] - Maximum allowd number of request in a
     * timespan. If this value is set then `batchTimespan` must be set too.
     * If this value is not set then `batchTimespan` is ignored.
     * @param {UInt} [value.batchTimespan] - How long a batch limit is apply for
     * in miliseconds.
     */
    constructor(value) {
        assertConfigObject(value, 'value', [
            'rateLimit', 'batchLimit', 'batchTimespan'
        ])
        let {rateLimit, batchLimit, batchTimespan} = value
        if (rateLimit !== undefined) {
            UInt.assertInstance(rateLimit, 'value.rateLimit')
            this._rateLimit = rateLimit
        }
        if (batchLimit !== undefined) {
            UInt.assertInstance(batchLimit, 'value.batchLimit')
            UInt.assertInstance(batchTimespan, 'value.batchTimespan')
            this._batchLimit = batchLimit
            this._batchTimespan = batchTimespan
        }
    }

    /**
     * @type {UInt}
     */
    get rateLimit() {
        return this._rateLimit
    }

    /**
     * @type {UInt}
     */
    get batchLimit() {
        return this._batchLimit
    }

    /**
     * Timespan in miliseconds.
     *
     * @type {UInt}
     */
    get batchTimespan() {
        return this._batchTimespan
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof EndpointQuota) === false) {
            DataError.throw('not a EndpointQuota: ' + hint)
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
 * Hash of a block, 32 bytes.
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
 * Hash of a transaction, 32 bytes.
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
     * @returns {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString('hex')
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
     * @param {BigUInt} value.number
     * @param {Timestamp} value.timestamp
     * @param {Array<TransactionHash>} value.transactions
     */
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {number, timestamp, transactions} = value
        BigUInt.assertInstance(number, 'value.number')
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
     * @type {BigUInt}
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
            number: BigUInt.fromHeximal(value.number),
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

class Transaction {
    /**
     *
     * @param {object} value
     * @param {TransactionHash} value.hash
     * @param {Address} value.from
     * @param {Address} value.to
     * @param {BigUInt} value.blockNumber
     * @param {UInt16} value.transactionIndex
     */
    constructor(value) {
        assertObject(value, 'value')
        let {hash, from, to, blockNumber, transactionIndex} = value
        TransactionHash.assertInstance(hash, 'value.hash')
        Address.assertInstance(from, 'value.from')
        Address.assertInstance(to, 'value.to')
        BigUInt.assertInstance(blockNumber, 'value.blockNumber')
        UInt16.assertInstance(transactionIndex, 'value.transactionIndex')
        this._hash = hash
        this._from = from
        this._to = to
        this._blockNumber = blockNumber
        this._transactionIndex = transactionIndex
    }

    /**
     * @type {TransactionHash}
     */
    get hash() {
        return this._hash
    }

    /**
     * @type {Address}
     */
    get from() {
        return this._from
    }

    /**
     * @type {Address}
     */
    get to() {
        return this._to
    }

    /**
     * @type {BigUInt}
     */
    get blockNumber() {
        return this._blockNumber
    }

    /**
     * @type {UInt16}
     */
    get transactionIndex() {
        return this._transactionIndex
    }

    /**
     *
     * @param {object} data - Result from RPC.
     * @returns {Transaction}
     * @throws {DataError}
     */
    static fromRpcResult(data) {
        assertObject(data, 'data')
        let {hash, from, to, blockNumber, transactionIndex} = data
        return new Transaction({
            hash: TransactionHash.fromHeximal(hash),
            from: Address.fromHeximal(from),
            to: Address.fromHeximal(to),
            blockNumber: BigUInt.fromHeximal(blockNumber),
            transactionIndex: UInt16.fromHeximal(transactionIndex)
        })
    }

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof Transaction) === false) {
            DataError.throw('not a Transaction: ' + hint)
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

    /**
     *
     * @param {any} value
     * @param {string} hint
     * @throws {DataError}
     */
    static assertInstance(value, hint = ASSERT_DEFAULT_HINT) {
        if ((value instanceof LogTopic) === false) {
            DataError.throw('not a LogTopic: ' + hint)
        }
    }
}

/**
 * An array that contains at most 4 log topics.
 */
class LogTopicCombination {
    /**
     *
     * @param {Array<LogTopic>} value
     */
    constructor(value) {
        assertArray(value, 'value')
        if (value.length > 4) {
            DataError.throw('too many items, maximum is 4: value')
        }
        value.forEach((item, index) => {
            LogTopic.assertInstance(item, `value[${index}]`)
        })
        this._value = value
    }

    /**
     * @type {Array<LogTopic>}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Array<Heximal>} value
     * @returns {LogTopicCombination}
     * @throws {DataError}
     */
    static fromRpcResult(value) {
        assertArray(value, 'value')
        if (value.length > 4) {
            DataError.throw('too many items, maximum is 4: value')
        }
        let topics = value.map(LogTopic.fromHeximal)
        return new LogTopicCombination(topics)
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
}

/**
 * Log topics for filter logs.
 * See [Log Filters](https://docs.ethers.io/v5/concepts/events/)
 * for more details.
 */
class LogTopicFilter {
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
            LogTopicFilter._assertArrayOrTopic(
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
     * Transform to data that works as JSON RPC input.
     *
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
        if ((value instanceof LogTopicFilter) === false) {
            DataError.throw('not a LogTopicFilter: ' + hint)
        }
    }

    /**
     * @private
     * @param {LogTopic | Array<LogTopic>} value
     * @param {string} hint
     * @throws {DataError}
     */
    static _assertArrayOrTopic(value, hint) {
        if (value instanceof LogTopic) {
            return
        }
        if (LogTopicFilter._isTopicArray(value)) {
            return
        }
        DataError.throw(`not a topic or array of topics: ${hint}`)
    }

    /**
     * @private
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
 * Specific conditions for fetching logs.
 */
class LogFilter {
    /**
     *
     * @param {object} value
     * @param {BigUInt} value.fromBlock
     * @param {BigUInt} value.toBlock
     * @param {Array<Address>} [value.addresses]
     * @param {LogTopicFilter} [value.topics]
     */
    constructor(value) {
        assertConfigObject(value, 'value', [
            'fromBlock', 'toBlock', 'addresses', 'topics'
        ])
        let {fromBlock, toBlock, addresses, topics} = value
        BigUInt.assertInstance(fromBlock, 'value.fromBlock')
        BigUInt.assertInstance(toBlock, 'value.toBlock')
        if (fromBlock.value > toBlock.value) {
            DataError.throw('value.fromBlock must be <= value.toBlock')
        }
        addresses = addresses || []
        if (!Array.isArray(addresses)) {
            DataError.throw('not an array: value.addresses')
        }
        addresses.forEach((item, index) => {
            Address.assertInstance(
                item,
                `not a address: value.addresses[${index}]`
            )
        })
        topics = topics || new LogTopicFilter()
        LogTopicFilter.assertInstance(topics, 'value.topics')
        this._fromBlock = fromBlock
        this._toBlock = toBlock
        this._addresses = addresses
        this._topics = topics
    }

    /**
     * @type {BigUInt}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * @type {BigUInt}
     */
    get toBlock() {
        return this._toBlock
    }

    /**
     * @type {Address}
     */
    get addresses() {
        return this._addresses
    }

    /**
     * @type {LogTopicFilter}
     */
    get topics() {
        return this._topics
    }

    /**
     * Transform to data that works as JSON RPC input.
     *
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
    /**
     *
     * @param {object} value
     * @param {Address} value.address - Contract that emits log.
     * @param {BigUInt} value.blockNumber - Block number that contains log.
     * @param {UInt16} value.logIndex - Order of the log in block.
     * @param {UInt16} value.transactionIndex - Order of transaction that
     * emits log.
     * @param {LogTopicCombination} value.topics - List of log topics.
     * @param {ByteArray} value.data - Related data, could be decode by ABI.
     * @param {BlockHash} value.blockHash - Hash of block that contains log.
     * @param {TransactionHash} value.transactionHash - Hash of transaction
     * that emits log.
     */
    constructor(value) {
        if (typeof value !== 'object') {
            DataError.throw('not an object: value')
        }
        let {
            address, blockNumber, logIndex, transactionIndex,
            topics, data, blockHash, transactionHash
        } = value
        Address.assertInstance(address, 'value.address')
        BigUInt.assertInstance(blockNumber, 'value.blockNumber')
        UInt16.assertInstance(logIndex, 'value.logIndex')
        UInt16.assertInstance(transactionIndex, 'value.transactionIndex')
        LogTopicCombination.assertInstance(topics, 'value.topics')
        ByteArray.assertInstance(data, 'value.data')
        BlockHash.assertInstance(blockHash, 'value.blockHash')
        TransactionHash.assertInstance(
            transactionHash,
            'value.transactionHash'
        )
        this._address = address
        this._blockNumber = blockNumber
        this._logIndex = logIndex
        this._transactionIndex = transactionIndex
        this._topics = topics
        this._data = data
        this._blockHash = blockHash
        this._transactionHash = transactionHash
    }

    /**
     * @type {Address}
     */
    get address() {
        return this._address
    }

    /**
     * @type {BigUInt}
     */
    get blockNumber() {
        return this._blockNumber
    }

    /**
     * @type {UInt16}
     */
    get logIndex() {
        return this._logIndex
    }

    /**
     * @type {UInt16}
     */
    get transactionIndex() {
        return this._transactionIndex
    }

    /**
     * @type {LogTopicCombination}
     */
    get topics() {
        return this._topics
    }

    /**
     * @type {ByteArray}
     */
    get data() {
        return this._data
    }

    /**
     * @type {BlockHash}
     */
    get blockHash() {
        return this._blockHash
    }

    /**
     * @type {TransactionHash}
     */
    get transactionHash() {
        return this._transactionHash
    }

    /**
     *
     * @param {object} value
     * @returns {Log}
     * @throws {DataError}
     */
    static fromRpcResult(value) {
        assertObject(value, 'value')
        let data = {
            address: Address.fromHeximal(value.address),
            blockNumber: BigUInt.fromHeximal(value.blockNumber),
            logIndex: UInt16.fromHeximal(value.logIndex),
            transactionIndex: UInt16.fromHeximal(value.transactionIndex),
            topics: LogTopicCombination.fromRpcResult(value.topics),
            data: ByteArray.fromBadHeximal(value.data),
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
     * @param {Array<Log>} items
     * @param {BigUInt} confirmedBlockNumber - The log segment ensures
     * correctness of `items` in range `[filter.fromBlock, confirmedBlock]`.
     * It does not contain items from remain range
     * `(confirmedBlock, filter.toBlock)`.
     */
    constructor(items, confirmedBlockNumber) {
        if (!Array.isArray(items)) {
            DataError.throw('not an array: items')
        }
        items.forEach((item, index) => {
            Log.assertInstance(item, `not a log: items[${index}]`)
        })
        BigUInt.assertInstance(
            confirmedBlockNumber,
            'not a unsigned big integer number: confirmedBlockNumber'
        )
        if (
            items.length > 0 &&
            items[0].blockNumber.value > confirmedBlockNumber.value
        ) {
            DataError.throw('confirmedBlock is less than last block number')
        }
        this._items = items
        this._confirmedBlockNumber = confirmedBlockNumber
    }

    /**
     * @type {Array<Log>}
     */
    get items() {
        return this._items
    }

    /**
     * @type {BigUInt}
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
    if (typeof value !== 'object' || value === null) {
        DataError.throw('not an object: ' + hint)
    }
}

/**
 *
 * @param {object} value
 * @param {string} hint
 * @param {Array<string>} attributes - Accepted attribute names.
 */
function assertConfigObject(value, hint = ASSERT_DEFAULT_HINT, attributes=[]) {
    if (typeof value !== 'object' || value === null) {
        throw new DataError('not an object: ' + hint)
    }
    let configAttributes = Object.getOwnPropertyNames(value)
    if (configAttributes.length === 0) {
        return
    }
    let validAttributes = new Set(attributes)
    for (let attribute of configAttributes) {
        if (!validAttributes.has(attribute)) {
            throw new DataError('not accepted attribute: ' + attribute)
        }
    }
}

/**
 *
 * @param {string | undefined} value
 * @param {string} hint
 * @throws {DataError}
 */
function assertOptionalString(value, hint = ASSERT_DEFAULT_HINT) {
    if (
        (value === undefined) ||
        (typeof value === 'string')
    ) {
        return
    }
    throw new DataError('not a optional string: ' + hint)
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
        DataError.throw('overflow 53 bits unsigned integer number: value')
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
        DataError.throw('not a heximal: value')
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
    NotExistedError,
    UInt,
    UInt16,
    BigUInt,
    Timestamp,
    HttpUrl,
    HttpEndpoint,
    EndpointQuota,
    TransactionHash,
    Address,
    Block,
    Transaction,
    LogTopic,
    LogTopicCombination,
    LogTopicFilter,
    LogFilter,
    Log,
    LogSegment,
    assertObject,
    assertConfigObject,
    assertOptionalString,
    assertArray
}
