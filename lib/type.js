'use strict'

/* eslint-disable max-lines-per-function */

/**
 * All types has a default constructor that does not validate input data.
 * This is good for performance from internal code by assume that input data
 * is valid all. Any malformed data is a bug and must be fix.
 *
 * For creating a new instance of type from external data, constructor helpers
 * must be use instead of default constructor. For example `fromNumber()`,
 * `fromHeximal()`. These helper ensures valid data, if not then an error will
 * be throw.
 *
 * For converting to other types, transforming helpers should be used. For
 * example `toHeximal()`, `toRpcInput()`.
 *
 * @file
 */

const path = require('path')
const {BigNumber} = require('@ethersproject/bignumber')
const {
    Result, UInt, UInt16, UInt64, UInt256, Timestamp, Timespan, DataSize,
    Heximal, ByteData, validateHeximal, validateArray, validateArrayItems,
    validateInstance, validateInstanceMap, mapObject, mapArray
} = require('minitype')

/**
 * A heximal string, prefixed `0x`. The value `0x` is valid.
 *
 * @typedef {string} BadHeximal
 */

/**
 * List of error code.
 *
 * @readonly
 * @enum {number}
 */
const ErrorCode = {
    NODE_OVERLOADING: 0x010000,
    NODE_BAD_REQUEST: 0x010002,
    NODE_BAD_RESPONSE: 0x010003,
    NODE_BAD_SERVER: 0x010004,
    NODE_NO_BLOCK: 0x010005,
    NODE_NO_TRANSACTION: 0x010006,
    NODE_TIMESTAMP_LOCK: 0x01000001,
    NODE_REQUEST_QUOTA: 0x01000002,
    NODE_UNSAFE_BLOCK: 0x01000003,
    NODE_BAD_SERVER_LOCK: 0x01000004,
    NODE_BAD_RESPONSE_LOCK: 0x01000005,
    NODE_OVERLOADING_LOCK: 0x01000006,
    GATEWAY_BAD_BACKEND: 0x0100000001,
    GATEWAY_NO_BACKEND: 0x0100000002
}
/**
 * @readonly
 */
const ErrorString = getInvertedObject(ErrorCode)
/**
 * @readonly
 * @enum {number}
 */
const LogLevel = {
    NONE: 0,
    INFO: 1,
    DEBUG: 2,
    WARN: 3,
    ERROR: 4,
    assert: function(value) {
        if (
            !Number.isInteger(value) ||
            value < 0 || value > 4
        ) {
            throw new TypeError('expect a log level')
        }
    },
    assertOptional: function(value, hint) {
        if (value !== undefined) {
            this.assert(value, hint)
        }
    }
}

class BadError extends Error {
    /**
     *
     * @param {ErrorCode} code
     * @param {string} message
     * @param {any} data
     */
    constructor(code, message = undefined, data = undefined) {
        let errorMessage = message
            ? ErrorString[code] + ' ' + message
            : ErrorString[code]
        super(errorMessage)
        this.name = 'BadError'
        this.code = code
        this.data = data
    }

    /**
     *
     * @param {ErrorCode} code
     * @param {any} data
     * @return {BadError}
     */
    static noMessage(code, data = undefined) {
        return new BadError(code, undefined, data)
    }

    /**
     *
     * @param {ErrorCode} code
     * @param {string} message
     * @return {BadError}
     */
    static noData(code, message) {
        return new BadError(code, message)
    }
}

/**
 * Shortcut for return a result by BadError.
 *
 * @param {ErrorCode} code
 * @param {string} message
 * @param {any} data - Related data for hinting error.
 * @return {Result<BadError, undefined>}
 */
Result.badError = function(code, message, data) {
    let error = new BadError(code, message, data)
    return Result.error(error)
}

/**
 * 32 bytes data.
 */
class ByteData32 {
    /**
     * A buffer, 32 bytes.
     *
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Buffer} value - A buffer, 32 bytes.
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {ByteData} other
     * @return {boolean}
     */
    eq(other) {
        return Buffer.compare(this._value, other._value) === 0
    }

    /**
     *
     * @param {Buffer} value
     * @return {Result<TypeError, ByteData32>}
     */
    static fromBuffer(value) {
        if (
            (value instanceof Buffer) === false ||
            value.length !== 32
        ) {
            return Result.typeError('expect a buffer 32 bytes')
        }
        let data = new ByteData32(value)
        return Result.ok(data)
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<TypeError, ByteData32>}
     */
    static fromHeximal(value) {
        let r1 = heximalToFixedBuffer(value, 32)
        if (r1.error) {
            return r1
        }
        let data = new ByteData32(r1.data)
        return Result.ok(data)
    }

    /**
     *
     * @return {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString('hex')
    }
}

/**
 * URL has `http` or `https` protocol and has no creadential such as username
 * and password.
 */
class HttpUrl {
    /**
     * @type {URL}
     */
    get value() {
        return this._value
    }

    /**
     * Initialize by {@link HttpUrl.fromString}.
     *
     * @param {URL} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {string} value
     * @return {Result<TypeError, HttpUrl>}
     */
    static fromString(value) {
        let r1 = HttpUrl._parseUrl(value)
        if (r1.error) {
            return r1
        }
        let {data: url} = r1
        if ((url.protocol !== 'http:') && (url.protocol !== 'https:')) {
            return Result.typeError('expect protocol http or https')
        }
        if (url.username || url.password) {
            return Result.typeError('expect no username or password')
        }
        let data = new HttpUrl(url)
        return Result.ok(data)
    }

    /**
     * @private
     * @param {string} value
     * @return {Result<TypeError, URL>}
     */
    static _parseUrl(value) {
        try {
            let data = new URL(value)
            return Result.ok(data)
        }
        catch {
            return Result.typeError('expect a URL')
        }
    }
}

/**
 * Information to interact to HTTP such as URL, authentication.
 */
class HttpEndpoint {
    /**
     * @type {HttpUrl}
     */
    get url() {
        return this._url
    }

    /**
     * @type {Timespan}
     */
    get timeout() {
        return this._timeout
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
     * Initialize by {@link HttpEndpoint.create}.
     *
     * @param {object} values
     */
    constructor(values) {
        this._url = values.url
        this._username = values.username
        this._password = values.password
        this._timeout = values.timeout
    }

    /**
     * @param {object} object
     * @param {HttpUrl} object.url
     * @param {string} [object.username] - Username and password is
     * use for basic authentication. See RFC 7617.
     * @param {string} [object.password]
     * @param {Timespan} [object.timeout=3000]
     * @return {Result<TypeError, HttpEndpoint>}
     */
    static create(object) {
        let r1 = validateInstanceMap(object, [
            ['url', HttpUrl],
            ['username', 'string', true],
            ['password', 'string', true],
            ['timeout', Timespan, true]
        ])
        if (r1.error) {
            return r1
        }
        let {url, username, password, timeout} = object
        timeout = timeout || Timespan.fromMiliseconds(3000).open()
        let data = new HttpEndpoint({url, username, password, timeout})
        return Result.ok(data)
    }
}

/**
 * Configuration for a Ethereum endpoint.
 */
class EthEndpoint {
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
     * It is estimate by `logTimeBorder`.
     *
     * @type {Timespan}
     */
    get timeout() {
        return this._timeout
    }

    /**
     * @type {EndpointQuota}
     */
    get quota() {
        return this._quota
    }

    /**
     * @type {UInt64}
     */
    get logSafeGap() {
        return this._logSafeGap
    }

    /**
     * @type {UInt64}
     */
    get logRangeBoundary() {
        return this._logRangeBoundary
    }

    /**
     * @type {DataSize}
     */
    get logSizeBorder() {
        return this._logSizeBorder
    }

    /**
     * @type {Timespan}
     */
    get logTimeBorder() {
        return this._logTimeBorder
    }

    /**
     * @type {UInt64}
     */
    get logQuantityBorder() {
        return this._logQuantityBorder
    }

    /**
     * Initialize by {@link EthEndpoint.create}.
     *
     * @param {object} values
     */
    constructor(values) {
        let {
            url, username, password, quota, logSafeGap, timeout,
            logRangeBoundary, logSizeBorder, logTimeBorder, logQuantityBorder
        } = values
        this._url = url
        this._username = username
        this._password = password
        this._quota = quota
        this._logSafeGap = logSafeGap
        this._logRangeBoundary = logRangeBoundary
        this._logSizeBorder = logSizeBorder
        this._logTimeBorder = logTimeBorder
        this._logQuantityBorder = logQuantityBorder
        this._timeout = timeout
    }

    /**
     *
     * @param {object} config
     * @param {HttpUrl} config.url
     * @param {string} [config.username]
     * @param {string} [config.password]
     * @param {EndpointQuota} [config.quota]
     * @param {UInt64} [config.logSafeGap=15]
     * @param {UInt64} [config.logRangeBoundary=5,000] - Maximum of filter range
     * `toBlock - fromBlock` for calling to `getLogs()`.
     * @param {DataSize} [config.logSizeBorder=4MB] - Estimate next filter range
     * of `getLogs()` to keep returned data size is less than or equal this
     * one but does not guarantee.
     * @param {Timespan} [config.logTimeBorder=6s] - Estimate next filter range
     * of `getLogs()` to keep response time is less than or equal this one but
     * does not guarantee.
     * @param {UInt64} [config.logQuantityBorder=10,000] - Estimate next
     * filter range of `getLogs()` to keep returned quantities of log is less
     * than or equal this one but does not guarantee.
     * @return {Result<TypeError, EthEndpoint>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['url', HttpUrl],
            ['username', 'string', true],
            ['password', 'string', true],
            ['quota', EndpointQuota, true],
            ['logSafeGap', UInt64, true],
            ['logRangeBoundary', UInt64, true],
            ['logSizeBorder', DataSize, true],
            ['logTimeBorder', Timespan, true],
            ['logQuantityBorder', UInt64, true]
        ])
        if (r1.error) {
            return r1
        }
        let logTimeBorder = config.logTimeBorder ||
            Timespan.fromSeconds(5).open()
        let data = new EthEndpoint({
            url: config.url,
            username: config.username,
            password: config.password,
            quota: config.quota || EndpointQuota.create().open(),
            logSafeGap: config.logSafeGap || UInt64.fromNumber(15).open(),
            logRangeBoundary: config.logRangeBoundary ||
                UInt64.fromNumber(5 * 1000).open(),
            logSizeBorder: config.logSizeBorder ||
                DataSize.fromMegabytes(4).open(),
            logTimeBorder: logTimeBorder,
            logQuantityBorder: config.logQuantityBorder ||
                UInt64.fromNumber(10 * 1000).open(),
            timeout: logTimeBorder.addSeconds(6).open()
        })
        return Result.ok(data)
    }

    /**
     * Ensure that there are no duplicated URL form list of endpoints.
     *
     * @param {Array<EthEndpoint>} items
     * @param {number} [minSize] - Require at least quantities of item.
     * @return {Result<TypeError, undefined>}
     */
    static validateUniqueItems(items, minSize = undefined) {
        let r1 = validateArrayItems(items, EthEndpoint, minSize)
        if (r1.error) {
            return r1
        }
        let identities = items.map(EthEndpoint._getIdentity)
        let identitySet = new Set()
        for (let v of identities) {
            if (identitySet.has(v)) {
                return Result.typeError('duplicated `${v}`')
            }
            identitySet.add(v)
        }
        return Result.ok()
    }

    /**
     * Ensure that a endpoint is not duplicated for each lists.
     * Also ensure a endpoint does not belong to both lists.
     *
     * @param {Array<EthEndpoint>} list1
     * @param {Array<EthEndpoint>} list2
     * @return {Result<TypeError, undefined>}
     */
    static validateUniqueLists(list1, list2) {
        let r1 = EthEndpoint.validateUniqueItems(list1)
        if (r1.error) {
            return r1
        }
        let r2 = EthEndpoint.validateUniqueItems(list2)
        if (r2.error) {
            return r2
        }
        let identitySet1 = new Set(
            list1.map(EthEndpoint._getIdentity)
        )
        let identitySet2 = new Set(
            list2.map(EthEndpoint._getIdentity)
        )
        for (let k of identitySet1.keys()) {
            if (identitySet2.has(k)) {
                return Result.typeError(`duplicated ${k}`)
            }
        }
        return Result.ok()
    }

    /**
     * @private
     * @param {EthEndpoint} endpoint
     * @return {string}
     */
    static _getIdentity(endpoint) {
        let {url: {value: url}} = endpoint
        return url.host + path.resolve(url.pathname)
    }
}

/**
 * Specific limits of a endpoint.
 */
class EndpointQuota {
    /**
     * @type {UInt}
     */
    get batchLimit() {
        return this._batchLimit
    }

    /**
     * @type {Timespan}
     */
    get batchTimespan() {
        return this._batchTimespan
    }

    /**
     * Initialize by {@link EndpointQuota.create}.
     *
     * @param {object} config
     */
    constructor(config) {
        let {batchLimit, batchTimespan} = config
        this._batchLimit = batchLimit
        this._batchTimespan = batchTimespan
    }

    /**
     *
     * @param {object} config
     * @param {UInt} [config.batchLimit=60] - Maximum quantities of requests
     * in a timespan.
     * @param {Timespan} [config.batchTimespan=1m] - How long a batch limit is
     * apply for.
     * @return {Result<TypeError, EndpointQuota>}
     * @example
     * // Specify 100 requests in five minutes
     * let quota = EndpointQuota.create({
     *     batchLimit: UInt.fromNumber(100).open(),
     *     batchTimespan: Timestamp.fromMinutes(5).open()
     * })
     */
    static create(config = {}) {
        let r1 = validateInstanceMap(config, [
            ['batchLimit', UInt, true],
            ['batchTimespan', Timespan, true]
        ])
        if (r1.error) {
            return r1
        }
        let {batchLimit, batchTimespan} = config
        let data = new EndpointQuota({
            batchLimit: batchLimit || UInt.fromNumber(20).open(),
            batchTimespan: batchTimespan || Timespan.fromMinutes(1).open()
        })
        return Result.ok(data)
    }
}

/**
 * Ethereum address, 20 bytes.
 */
class Address {
    /**
     * 20 bytes buffer.
     *
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     * Initialize by {@link Address.fromBuffer}, {@link Address.fromHeximal}.
     *
     * @param {Buffer} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @return {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString('hex')
    }

    /**
     *
     * @param {Buffer} value
     * @return {Result<TypeError, Address>}
     */
    static fromBuffer(value) {
        if (
            (value instanceof Buffer) === false ||
            value.length !== 20
        ) {
            return Result.typeError('expect a buffer 20 bytes')
        }
        let data = new Address(value)
        return Result.ok(data)
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<TypeError, Address>}
     */
    static fromHeximal(value) {
        let r1 = heximalToFixedBuffer(value, 20)
        if (r1.error) {
            return r1
        }
        let {data: buffer} = r1
        let data = new Address(buffer)
        return Result.ok(data)
    }

    /**
     *
     * @param {Address} other
     * @return {boolean}
     * @throws {TypeError}
     */
    eq(other) {
        validateInstance(other, Address).open()
        return (this._value.compare(other._value) === 0)
    }

    /**
     *
     * @param {Address} other
     * @return {boolean}
     * @throws {TypeError}
     */
    lt(other) {
        validateInstance(other, Address).open()
        return (this._value.compare(other._value) === -1)
    }

    /**
     *
     * @param {Address} other
     * @return {boolean}
     * @throws {TypeError}
     */
    gt(other) {
        validateInstance(other, Address).open()
        return (this._value.compare(other._value) === 1)
    }
}

/**
 * Ethereum block.
 */
class Block {
    /**
     * Ordered number of the block.
     *
     * @type {UInt64}
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
     * @type {Array<ByteData32>}
     */
    get transactions() {
        return this._transactions
    }

    /**
     * Initialize by {@link Block.fromRpcResult}.
     *
     * @param {object} config
     * @param {UInt64} config.number
     * @param {Timestamp} config.timestamp
     * @param {Array<ByteData32>} config.transactions
     */
    constructor(config) {
        this._number = config.number
        this._timestamp = config.timestamp
        this._transactions = config.transactions
    }

    /**
     *
     * @param {object} config
     * @param {UInt64} config.number
     * @param {Timestamp} config.timestamp
     * @param {Array<ByteData32>} config.transactions
     * @return {Result<TypeError, Block>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['number', UInt64],
            ['timestamp', Timestamp],
            ['transactions', Array]
        ])
        if (r1.error) {
            return r1
        }
        let r2 = validateArrayItems(config.transactions, ByteData32)
        if (r2.error) {
            return Result.typeError(`transactions: ${r2.error.message}`)
        }
        let data = new Block(config)
        return Result.ok(data)
    }

    /**
     *
     * @param {object} value
     * @param {Heximal} value.number
     * @param {Heximal} value.timestamp - Unix timestamp in seconds.
     * @param {Array<Heximal>} value.transactions
     * @return {Result<TypeError, Block>}
     */
    static fromRpcResult(value) {
        let r1 = mapObject(value, [
            ['number', UInt64.fromHeximal],
            ['timestamp', Timestamp.fromHeximalSeconds],
            ['transactions', v => mapArray(v, ByteData32.fromHeximal)]
        ])
        if (r1.error) {
            return r1
        }
        let data = new Block(r1.data)
        return Result.ok(data)
    }
}

/**
 * Ethereum transaction.
 */
class Transaction {
    /**
     * @type {ByteData32}
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
     * @type {UInt64}
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
     * Initialize by {@link Transaction.fromRpcResult}.
     *
     * @param {object} object
     */
    constructor(object) {
        let {hash, from, to, blockNumber, transactionIndex} = object
        this._hash = hash
        this._from = from
        this._to = to
        this._blockNumber = blockNumber
        this._transactionIndex = transactionIndex
    }

    /**
     *
     * @param {object} object - Returned data from RPC.
     * @param {ByteData32} object.hash
     * @param {Address} object.from
     * @param {Address} object.to
     * @param {UInt64} object.blockNumber
     * @param {UInt16} object.transactionIndex
     * @return {Result<Transaction>}
     */
    static fromRpcResult(object) {
        let r1 = mapObject(object, [
            ['hash', ByteData32.fromHeximal],
            ['from', Address.fromHeximal],
            ['to', Address.fromHeximal],
            ['blockNumber', UInt64.fromHeximal],
            ['transactionIndex', UInt16.fromHeximal]
        ])
        if (r1.error) {
            return r1
        }
        let data = new Transaction(r1.data)
        return Result.ok(data)
    }
}

/**
 * An array contains 4 log topics at most.
 */
class LogTopicCombination {
    /**
     * @type {Array<ByteData32>}
     */
    get value() {
        return this._value
    }

    /**
     * Initialize by {@link LogTopicCombination.fromRpcResult}.
     *
     * @param {Array<ByteData32>} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     * @return {Array<Heximal>}
     */
    toHeximalArray() {
        return this._value.map(v => v.toHeximal())
    }

    /**
     *
     * @param {Array<ByteData32>} value
     * @return {Result<TypeError, LogTopicCombination>}
     */
    static create(value) {
        let r1 = validateArrayItems(value, ByteData32, 0, 4)
        if (r1.error) {
            return r1
        }
        let instance = new LogTopicCombination(value)
        return Result.ok(instance)
    }

    /**
     *
     * @param {Array<Heximal>} value
     * @return {Result<TypeError, LogTopicCombination>}
     */
    static fromHeximals(value) {
        let r1 = validateArray(value, 0, 4)
        if (r1.error) {
            return r1
        }
        let r2 = mapArray(value, ByteData32.fromHeximal)
        if (r2.error) {
            return r2
        }
        let data = new LogTopicCombination(r2.data)
        return Result.ok(data)
    }

    /**
     *
     * @param {Array<Heximal>} value
     * @return {Result<TypeError, LogTopicCombination>}
     */
    static fromRpcResult(value) {
        return LogTopicCombination.fromHeximals(value)
    }
}

/**
 * Topics filter for retrieving logs.
 * See [Log Filters](https://docs.ethers.io/v5/concepts/events/)
 * for more details.
 */
class LogTopicFilter {
    /**
     * @type {Array<ByteData32 | Array<ByteData32>>}
     */
    get value() {
        return this._value
    }

    /**
     * Initialize by {@link LogTopicFilter.create}.
     *
     * @param {Array<ByteData32 | Array<ByteData32>>} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     * Transform to data that works as JSON RPC input.
     *
     * @return {Array<Heximal | Array<Heximal>>}
     */
    toRpcInput() {
        return this._value.map(item => {
            if (item instanceof ByteData32) {
                return item.toHeximal()
            }
            else {
                return item.map(child => child.toHeximal())
            }
        })
    }

    /**
     *
     * @param {Array<ByteData32 | Array<ByteData32>>} value
     * @return {Result<TypeError, LogTopicFilter>}
     * @example
     * // Specify topic[0]
     * let topics = LogTopicFilter.create([
     *     ByteData32.fromHeximal('0x1234f...').open()
     * ]).open()
     *
     * // Specific topic[0] with nested topic filters.
     * let topcis = LogTopicFilter.create([
     *     [
     *         ByteData32.fromHeximal('0x1234...').open(),
     *         ByteData32.fromHeximal('0xabcdef...').open()
     *     ]
     * ]).open()
     */
    static create(value = []) {
        let r1 = validateArray(value, 0, 4)
        if (r1.error) {
            return r1
        }
        for (let [i, v] of value.entries()) {
            let r2 = LogTopicFilter._validateTopicOrArray(v)
            if (r2.error) {
                return Result.typeError(`[${i}]: ${r2.error.message}`)
            }
        }
        let data = new LogTopicFilter(value)
        return Result.ok(data)
    }

    /**
     * @private
     * @param {ByteData32 | Array<ByteData32>} value
     * @return {Result<TypeError, undefined>}
     */
    static _validateTopicOrArray(value) {
        if (Array.isArray(value)) {
            return validateArrayItems(value, ByteData32)
        }
        let r1 = validateInstance(value, ByteData32)
        if (r1.error) {
            let message = 'expect ByteData32 or an Array<ByteData32>'
            return Result.typeError(message)
        }
        return Result.ok()
    }
}

/**
 * Specify conditions for fetching logs.
 */
class LogFilter {
    /**
     * @type {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * @type {UInt64}
     */
    get toBlock() {
        return this._toBlock
    }

    /**
     * @type {Array<Address>}
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
     * Initialize by {@link LogFilter.create}.
     *
     * @param {object} values
     */
    constructor(values) {
        this._fromBlock = values.fromBlock
        this._toBlock = values.toBlock
        this._addresses = values.addresses
        this._topics = values.topics
    }

    /**
     * Transform to data that works as JSON RPC input.
     *
     * @return {object}
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
     * @param {object} object
     * @param {UInt64} object.fromBlock
     * @param {UInt64} object.toBlock
     * @param {Array<Address>} [object.addresses=[]]
     * @param {LogTopicFilter} [object.topics=LogTopicFilter()]
     * @return {Result<TypeError, LogFilter>}
     */
    static create(object) {
        let r1 = validateInstanceMap(object, [
            ['fromBlock', UInt64],
            ['toBlock', UInt64],
            ['addresses', Array, true],
            ['topics', LogTopicFilter, true]
        ])
        if (r1.error) {
            return r1
        }
        let {fromBlock, toBlock, addresses, topics} = object
        addresses = addresses || []
        validateArrayItems(addresses, Address)
        topics = topics || LogTopicFilter.create().open()
        if (fromBlock.value > toBlock.value) {
            return Result.typeError('expect fromBlock > toBlock')
        }
        let data = new LogFilter({fromBlock, toBlock, addresses, topics})
        return Result.ok(data)
    }
}

/**
 * A log record from EVM.
 */
class Log {
    /**
     * @type {Address}
     */
    get address() {
        return this._address
    }

    /**
     * @type {UInt64}
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
     * @type {ByteData}
     */
    get data() {
        return this._data
    }

    /**
     * @type {ByteData32}
     */
    get blockHash() {
        return this._blockHash
    }

    /**
     * @type {ByteData32}
     */
    get transactionHash() {
        return this._transactionHash
    }

    /**
     * Initialize by {@link Log.fromRpcResult}.
     *
     * @param {object} values
     * @param {Address} values.address - Contract that emits log.
     * @param {UInt64} values.blockNumber - Block number that contains log.
     * @param {UInt16} values.logIndex - Order of the log in block.
     * @param {UInt16} values.transactionIndex - Order of transaction that
     * emits log.
     * @param {LogTopicCombination} values.topics - List of log topics.
     * @param {ByteData} values.data - Related data, could be decode by ABI.
     * @param {ByteData32} values.blockHash - Hash of block that contains log.
     * @param {ByteData32} values.transactionHash - Hash of transaction
     * that emits log.
     */
    constructor(values) {
        let {
            address, blockNumber, logIndex, transactionIndex,
            topics, data, blockHash, transactionHash
        } = values
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
     *
     * @param {object} data
     * @param {Address} data.address - Contract that emits log.
     * @param {UInt64} data.blockNumber - Block number that contains log.
     * @param {UInt16} data.logIndex - Order of the log in block.
     * @param {UInt16} data.transactionIndex - Order of transaction that
     * emits log.
     * @param {LogTopicCombination} data.topics - List of log topics.
     * @param {ByteData} data.data - Related data, could be decode by ABI.
     * @param {ByteData32} data.blockHash - Hash of block that contains log.
     * @param {ByteData32} data.transactionHash - Hash of transaction.
     * @return {Result<TypeError, Log>}
     */
    static create(data) {
        let r1 = validateInstanceMap(data, [
            ['address', Address],
            ['blockNumber', UInt64],
            ['logIndex', UInt16],
            ['transactionIndex', UInt16],
            ['topics', LogTopicCombination],
            ['data', ByteData],
            ['blockHash', ByteData32],
            ['transactionHash', ByteData32]
        ])
        if (r1.error) {
            return r1
        }
        let instance = new Log(data)
        return Result.ok(instance)
    }

    /**
     *
     * @param {object} values
     * @return {Result<TypeError, Log>}
     */
    static fromRpcResult(values) {
        let r1 = mapObject(values, [
            ['address', Address.fromHeximal],
            ['blockNumber', UInt64.fromHeximal],
            ['logIndex', UInt16.fromHeximal],
            ['transactionIndex', UInt16.fromHeximal],
            ['topics', LogTopicCombination.fromRpcResult],
            ['data', ByteData.fromHeximal],
            ['blockHash', ByteData32.fromHeximal],
            ['transactionHash', ByteData32.fromHeximal]
        ])
        if (r1.error) {
            return r1
        }
        let data = new Log(r1.data)
        return Result.ok(data)
    }
}

class BigMath {
    /**
     *
     * @param {...bigint} values
     * @return {bigint}
     * @throws {TypeError}
     */
    static min(...values) {
        validateArrayItems(values, 'bigint', 1).open()
        let result = values[0]
        for (let i = 1; i < values.length; ++i) {
            if (values[i] < result) {
                result = values[i]
            }
        }
        return result
    }

    /**
     *
     * @param {...bigint} values
     * @return {bigint}
     * @throws {TypeError}
     */
    static max(...values) {
        validateArrayItems(values, 'bigint', 1).open()
        let result = values[0]
        for (let i = 1; i < values.length; ++i) {
            if (values[i] > result) {
                result = values[i]
            }
        }
        return result
    }
}

/**
 * Return a new object A, where `A[v] = k`, `k` is a property name form input
 * object `object` and `v = object[k]`.
 *
 * @param {object} object
 * @return {object}
 */
function getInvertedObject(object) {
    let names = Object.getOwnPropertyNames(object)
    let result = {}
    for (let name of names) {
        let code = object[name]
        result[code] = name
    }
    return result
}

/**
 * **Tags:** `PARTIAL_INPUT_VALIDATION`.
 *
 * @param {Heximal} value
 * @param {number} size - Number of bytes. This input is not validate.
 * @return {Result<TypeError, Buffer>}
 */
function heximalToFixedBuffer(value, size) {
    let r1 = validateHeximal(value)
    if (r1.error) {
        return r1
    }
    let digits = value.slice(2)
    if (digits.length !== (2 * size)) {
        return Result.typeError(`expect a heximal ${size} bytes`)
    }
    let buffer = Buffer.from(digits, 'hex')
    return Result.ok(buffer)
}

/**
 * @param {Heximal} value
 * @return {Result<TypeError, Buffer>}
 */
function heximalToBuffer(value) {
    let r1 = validateHeximal(value)
    if (r1.error) {
        return r1
    }
    let hasEvenLength = (value.length % 2) === 0
    let evenHeximal = hasEvenLength
        ? value.slice(2)
        : '0' + value.slice(2)
    let buffer = Buffer.from(evenHeximal, 'hex')
    return Result.ok(buffer)
}

module.exports = {
    Result,
    LogLevel,
    ErrorCode,
    ErrorString,
    BadError,
    UInt,
    UInt16,
    UInt64,
    UInt256,
    Timestamp,
    Timespan,
    DataSize,
    ByteData,
    ByteData32,
    BigNumber,
    HttpUrl,
    HttpEndpoint,
    EthEndpoint,
    EndpointQuota,
    Address,
    Block,
    Transaction,
    LogTopicCombination,
    LogTopicFilter,
    LogFilter,
    Log,
    BigMath,
    getInvertedObject,
    heximalToFixedBuffer,
    heximalToBuffer
}
