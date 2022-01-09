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
 * @module type
 */

/**
 * A heximal string, prefixed `0x` and has at least a heximal digit.
 *
 * @typedef {string} Heximal
 */

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
    NONE: 0,
    NOT_U_INT: 1,
    NOT_HEXIMAL: 2,
    OVERFLOW_U_INT: 3,
    OVERFLOW_U_INT_16: 4,
    BAD_TYPE: 5,
    NOT_BUFFER: 6,
    NOT_URL: 7,
    NOT_HTTP_PROTOCOL: 8,
    NOT_BIG_U_INT: 9,
    NOT_ALLOWED_URL_AUTHENTICATION: 10,
    NOT_HTTP_URL: 11,
    NOT_OPTIONAL_STRING: 12,
    NOT_TIMESPAN: 13,
    NOT_ARRAY: 14,
    NOT_ACCEPTED_SIZE: 15,
    NOT_ARRAY_OR_BYTE_DATA_32: 16,
    BAD_RANGE: 17
}
/**
 * @readonly
 */
const ErrorString = getInvertedObject(ErrorCode)

class ResultError extends Error {
    /**
     *
     * @param {ErrorCode} code
     * @param {string} errorString
     * @param {string} hint
     */
    constructor(code, errorString, hint) {
        super(errorString)
        this.name = 'ResultError'
        this.code = code
        this.hint = hint
    }
}

/**
 * Result from construction, transform types.
 *
 * @template T - Type of returned data.
 */
class Result {
    /**
     * @type {ErrorCode}
     */
    get error() {
        return this._error
    }

    /**
     * @type {T}
     */
    get data() {
        return this._data
    }

    /**
     * @type {string}
     */
    get message() {
        return this._message
    }

    /**
     *
     * @param {ErrorCode} error
     * @param {T} data
     * @param {string} message
     */
    constructor(error, data = undefined, message = undefined) {
        this._error = error
        this._data = data
        this._message = message
    }

    /**
     * Force to retrieve data immediately without care about errors.
     *
     * **WARN** This method is design for using in situations such as testing,
     * examples or top layers handling. Do not use this one for internal
     * implementations because it breaks error context and handling possibility.
     *
     * @return {T}
     * @throws {Error}
     */
    open() {
        let {error, message, data} = this
        if (error) {
            throw new ResultError(error, this.errorString(), message)
        }
        return data
    }

    /**
     * Short description of error code.
     *
     * @return {string}
     */
    errorString() {
        return ErrorString[this.error]
    }

    /**
     *
     * @param {T} data
     * @return {Result<T>}
     */
    static ok(data) {
        return new Result(ErrorCode.NONE, data)
    }

    /**
     *
     * @param {ErrorCode} code
     * @param {string} message
     * @return {Result<undefined>}
     */
    static error(code, message) {
        return new Result(code, undefined, message)
    }
}

/**
 * Unsigned integer number, 53 bits.
 */
class UInt {
    /**
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {number} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     * 53 bits all set heximal: `0x1FFFFFFFFFFFFF`.
     *
     * @param {Heximal} value
     * @return {Result<UInt>}
     */
    static fromHeximal(value) {
        let {error, data} = heximalToUnsignedInteger(value)
        if (error) {
            return Result.error(error)
        }
        let number = new UInt(data)
        return Result.ok(number)
    }
}

/**
 * Unsigned integer number, 16 bits.
 */
class UInt16 {
    /**
     *
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {number} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<UInt16>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.NOT_HEXIMAL)
        }
        let [length] = getHeximalLength(value)
        if (length > 4) {
            return Result.error(ErrorCode.OVERFLOW_U_INT_16)
        }
        let number = Number(value, 16)
        let number16 = new UInt16(number)
        return Result.ok(number16)
    }
}

/**
 * Unsigned, big integer number.
 */
class BigUInt {
    /**
     * @type {bigint}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {bigint} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     * @return {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString(16)
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<BigUInt>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.NOT_HEXIMAL)
        }
        let bigint = BigInt(value)
        if (bigint < 0) {
            return Result.error(ErrorCode.NOT_BIG_U_INT)
        }
        let number = new BigUInt(bigint)
        return Result.ok(number)
    }
}

/**
 * Unix timestmap, 53 bits.
 */
class Timestamp {
    /**
     * Unix timestamp in miliseconds.
     *
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {number} value - Unix timestamp in miliseconds.
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<Timestamp>}
     */
    static fromHeximal(value) {
        let {error, data} = heximalToUnsignedInteger(value)
        if (error) {
            return Result.error(error)
        }
        let miliseconds = new Timestamp(data)
        return Result.ok(miliseconds)
    }
}

/**
 * Time period, 53 bits.
 */
class Timespan {
    /**
     * Time period in miliseconds.
     *
     * @type {number}
     */
    get value() {
        return this._value
    }

    /**
     * @param {number} value - Time period in miliseconds.
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {number} value - Time period in miliseconds.
     * @return {Result<Timespan>}
     */
    static fromNumber(value) {
        let {error, data} = heximalToUnsignedInteger(value)
        if (error) {
            return Result.error(error)
        }
        let miliseconds = new Timespan(data)
        return Result.ok(miliseconds)
    }
}

/**
 * Size of data.
 */
class DataSize {
    /**
     * Size of data in bytes.
     *
     * @type {bigint}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {bigint} value - Size of data in bytes.
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {bigint | number} value - Size of data in bytes.
     * @return {Result<DataSize>}
     */
    static fromNumber(value) {
        if (isUnsignedInteger(value)) {
            let bigint = BigInt(value)
            let data = new DataSize(bigint)
            return Result.ok(data)
        }
        if (isBigUnsignedInteger(value)) {
            let data = new DataSize(value)
            return Result.ok(data)
        }
        return Result.error(ErrorCode.BAD_TYPE)
    }
}

/**
 * Array of bytes as a buffer.
 */
class ByteData {
    /**
     * @type {Buffer}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Buffer} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<ByteData>}
     */
    static fromHeximal(value) {
        let {error, data} = heximalToBuffer(value)
        if (error) {
            return Result.error(error)
        }
        let byteData = new ByteData(data)
        return Result.ok(byteData)
    }

    /**
     * Deal with heximal `0x`, consider it is empty data.
     * Although RPC specification disallows that heximal format, the
     * implementations keep return it somehow.
     *
     * See [HEX value encoding](https://eth.wiki/json-rpc/API)
     * for more details.
     *
     * @param {BadHeximal} value
     * @return {Result<ByteData>}
     */
    static fromBadHeximal(value) {
        let heximal = value === '0x'
            ? '0x0'
            : value
        let {error, data} = heximalToBuffer(heximal)
        if (error) {
            return Result.error(error)
        }
        let byteData = new ByteData(data)
        return Result.ok(byteData)
    }
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
     * @param {Heximal} value
     * @return {Result<ByteData32>}
     */
    static fromHeximal(value) {
        let {error, data} = heximalToFixedBuffer(value, 32)
        if (error) {
            return Result.error(error)
        }
        let byteData = new ByteData32(data)
        return Result.ok(byteData)
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
     * @type {string}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {string} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {string} value
     * @return {Result<HttpUrl>}
     */
    static fromString(value) {
        let url = HttpUrl._parseUrl(value)
        if (!url) {
            return Result.error(ErrorCode.NOT_URL)
        }
        if ((url.protocol !== 'http:') && (url.protocol !== 'https:')) {
            return Result.error(ErrorCode.NOT_HTTP_PROTOCOL)
        }
        if (url.username || url.password) {
            return Result.error(ErrorCode.NOT_ALLOWED_URL_AUTHENTICATION)
        }
        return Result.ok(value)
    }

    /**
     * @private
     * @param {string} value
     * @return {URL | undefined}
     */
    static _parseUrl(value) {
        try {
            return new URL(value)
        }
        catch {
            return undefined
        }
    }
}

/**
 * Information to interact with HTTP such as URL, authentication.
 */
class HttpEndpoint {
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
     * @param {object} values
     * @param {HttpUrl} values.url
     * @param {string} [values.username]
     * @param {string} [values.password]
     */
    constructor(values) {
        let {url, username, password} = values
        this._url = url
        this._username = username
        this._password = password
    }

    /**
     *
     * @param {object} values
     * @return {Result<HttpEndpoint>}
     */
    static fromValues(values) {
        let acceptedAttributes = ['url', 'username', 'password']
        let {error, message} = validateObject(values, acceptedAttributes)
        if (error) {
            return Result.error(error, message)
        }
        let {url, username, password} = values
        if ((url instanceof HttpUrl) === false) {
            return Result.error(ErrorCode.NOT_HTTP_URL, 'values.url')
        }
        if (!isOptionalString(username)) {
            return Result.error(
                ErrorCode.NOT_OPTIONAL_STRING, 'values.username'
            )
        }
        if (!isOptionalString(password)) {
            return Result.error(
                ErrorCode.NOT_OPTIONAL_STRING, 'values.password'
            )
        }
        let endpoint = new HttpEndpoint({url, username, password})
        return Result.ok(endpoint)
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
     *
     * @param {object} values
     * @param {UInt} values.batchLimit - Maximum allowd number of request in a
     * timespan. If this value is set then `batchTimespan` must be set too.
     * If this value is not set then `batchTimespan` is ignored.
     * @param {Timespan} values.batchTimespan - How long a batch limit is
     * apply for in miliseconds.
     */
    constructor(values) {
        let {batchLimit, batchTimespan} = values
        this._batchLimit = batchLimit
        this._batchTimespan = batchTimespan
    }

    /**
     *
     * @param {object} values
     * @param {UInt} values.batchLimit
     * @param {Timespan} values.batchTimespan
     * @return {Result<EndpointQuota>}
     */
    static fromValues(values) {
        let acceptedAttributes = ['batchLimit', 'batchTimespan']
        let {error, message} = validateObject(values, acceptedAttributes)
        if (error) {
            return Result.error(error, message)
        }
        let {batchLimit, batchTimespan} = values
        if ((batchLimit instanceof UInt) === false) {
            return Result.error(
                ErrorCode.NOT_U_INT, 'values.batchLimit'
            )
        }
        if ((batchTimespan instanceof Timespan) === false) {
            return Result.error(
                ErrorCode.NOT_TIMESPAN, 'values.batchTimespan'
            )
        }
        let quota = new EndpointQuota(batchLimit, batchTimespan)
        return Result.ok(quota)
    }
}

/**
 * ETH address, 20 bytes.
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
     *
     * @param {Buffer} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @return {string}
     */
    toHeximal() {
        return '0x' + this._value.toString('hex')
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<Address>}
     */
    static fromHeximal(value) {
        let {error, data} = heximalToBuffer(value)
        if (error) {
            return Result.error(error)
        }
        if (data.length !== 20) {
            return Result.error(ErrorCode.NOT_ACCEPTED_SIZE)
        }
        let address = new Address(data)
        return Result.ok(address)
    }
}

/**
 * ETH block.
 */
class Block {
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
     * @type {Array<ByteData32>}
     */
    get transactions() {
        return this._transactions
    }

    /**
     *
     * @param {object} values
     * @param {BigUInt} values.number
     * @param {Timestamp} values.timestamp
     * @param {Array<ByteData32>} values.transactions
     */
    constructor(values) {
        let {number, timestamp, transactions} = values
        this._number = number
        this._timestamp = timestamp
        this._transactions = transactions
    }

    /**
     *
     * @param {any} values
     * @return {Result<Block>}
     */
    static fromRpcResult(values) {
        if (!isObject(values)) {
            return Result.error(ErrorCode.NOT_OBJECT, 'values')
        }
        let {error: e1, data: number} = BigUInt.fromHeximal(values.number)
        if (e1 !== ErrorCode.NONE) {
            return Result.error(e1, 'values.number')
        }
        let {error: e2, data: timestamp} = Timestamp.fromHeximal(
            values.timestamp
        )
        if (e2 !== ErrorCode.NONE) {
            return Result.error(e2, 'values.timestamp')
        }
        if (!Array.isArray(values.transactions)) {
            return Result.error(
                ErrorCode.NOT_ARRAY, 'values.transactions'
            )
        }
        let transactions = []
        for (let [i, v] of values.transactions.entries()) {
            let {error: e3, data: tx} = ByteData32.fromHeximal(v)
            if (e3) {
                return Result.error(e3, `values.transactions[${i}]`)
            }
            transactions.push(tx)
        }
        let block = new Block({number, timestamp, transactions})
        return Result.ok(block)
    }
}

/**
 * ETH transaction.
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
     * @param {object} values
     * @param {ByteData32} values.hash
     * @param {Address} values.from
     * @param {Address} values.to
     * @param {BigUInt} values.blockNumber
     * @param {UInt16} values.transactionIndex
     */
    constructor(values) {
        let {hash, from, to, blockNumber, transactionIndex} = values
        this._hash = hash
        this._from = from
        this._to = to
        this._blockNumber = blockNumber
        this._transactionIndex = transactionIndex
    }

    /**
     *
     * @param {object} values - Result from RPC.
     * @return {Result<Transaction>}
     */
    static fromRpcResult(values) {
        if (!isObject(values)) {
            return Result.error(ErrorCode.NOT_OBJECT, 'values')
        }
        let {error: e1, data: hash} = Transaction.fromHeximal(values.hash)
        if (e1 !== ErrorCode.NONE) {
            return Result.error(e1, 'values.hash')
        }
        let {error: e2, data: from} = Transaction.fromHeximal(values.from)
        if (e2 !== ErrorCode.NONE) {
            return Result.error(e2, 'values.from')
        }
        let {error: e3, data: to} = Transaction.fromHeximal(values.to)
        if (e3 !== ErrorCode.NONE) {
            return Result.error(e3, 'values.to')
        }
        let {error: e4, data: blockNumber} = BigUInt.fromHeximal(
            values.blockNumber
        )
        if (e4 !== ErrorCode.NONE) {
            return Result.error(e4, 'values.blockNumber')
        }
        let {error: e5, data: transactionIndex} = UInt16.fromHeximal(
            values.transactionIndex
        )
        if (e5 !== ErrorCode.NONE) {
            return Result.error(e5, 'values.transactionIndex')
        }
        let transaction = new Transaction({
            hash, from, to, blockNumber, transactionIndex
        })
        return Result.ok(ErrorCode.NONE, transaction)
    }
}

/**
 * An array contains at most 4 log topics.
 */
class LogTopicCombination {
    /**
     * @type {Array<ByteData32>}
     */
    get value() {
        return this._value
    }

    /**
     *
     * @param {Array<ByteData32>} value
     */
    constructor(value) {
        this._value = value
    }

    /**
     *
     * @param {Array<Heximal>} value
     * @return {Result<LogTopicCombination>}
     */
    static fromRpcResult(value) {
        if (!Array.isArray(value)) {
            return Result.error(ErrorCode.NOT_ARRAY, 'value')
        }
        if (value.length > 4) {
            return Result.error(ErrorCode.NOT_ACCEPTED_SIZE, 'value')
        }
        let topics = []
        for (let heximal of value) {
            let {error, data: topic} = value.map(ByteData32.fromHeximal)
            if (error !== ErrorCode.NONE) {
                return Result.error(error, `value: ${heximal}`)
            }
            topics.push(topic)
        }
        let combination = new LogTopicCombination(topics)
        return Result.ok(ErrorCode.NONE, combination)
    }
}

/**
 * Log topics for retrive logs.
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
     *
     * @param {Array<ByteData32 | Array<ByteData32>>} value
     */
    constructor(value = []) {
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
     * @return {Result<LogTopicFilter>}
     */
    static fromArray(value) {
        if (!Array.isArray(value)) {
            return Result.error(ErrorCode.NOT_ARRAY, 'value')
        }
        if (value.length > 4) {
            return Result.error(ErrorCode.NOT_ACCEPTED_SIZE, 'value')
        }
        for (let [i, v] of value.entries()) {
            if (!LogTopicFilter._isArrayOrByteData32(v)) {
                return Result.error(
                    ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, `value[${i}]`)
            }
        }
        let filter = new LogTopicFilter(value)
        return Result.ok(filter)
    }

    /**
     * @private
     * @param {ByteData32 | Array<ByteData32>} value
     * @return {boolean}
     */
    static _isArrayOrByteData32(value) {
        return (value instanceof ByteData32) ||
            LogTopicFilter._isByteData32Array(value)
    }

    /**
     * @private
     * @param {Array<ByteData32>} value
     * @return {boolean}
     */
    static _isByteData32Array(value) {
        if (!Array.isArray(value)) {
            return false
        }
        for (let item of value) {
            if ((item instanceof ByteData32) === false) {
                return false
            }
        }
        return true
    }
}

/**
 * Specify conditions for fetching logs.
 */
class LogFilter {
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
     *
     * @param {object} values
     * @param {BigUInt} values.fromBlock
     * @param {BigUInt} values.toBlock
     * @param {Array<Address>} [values.addresses]
     * @param {LogTopicFilter} [values.topics]
     */
    constructor(values) {
        let {fromBlock, toBlock, addresses, topics} = values
        this._fromBlock = fromBlock
        this._toBlock = toBlock
        this._addresses = addresses
        this._topics = topics
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
     *
     * @param {object} values
     * @param {BigUInt} values.fromBlock
     * @param {BigUInt} values.toBlock
     * @param {Array<Address>} [values.addresses]
     * @param {LogTopicFilter} [values.topics]
     * @return {Result<LogFilter>}
     */
    static fromValues(values) {
        let acceptedAttributes = [
            'fromBlock', 'toBlock', 'addresses', 'topics'
        ]
        let {error, message} = validateObject(values, acceptedAttributes)
        if (error !== ErrorCode.NONE) {
            return Result.error(error, message)
        }
        let {fromBlock, toBlock, addresses, topics} = values
        if ((fromBlock instanceof BigUInt) === false) {
            return Result.error(
                ErrorCode.NOT_BIG_U_INT, 'values.fromBlock'
            )
        }
        if ((toBlock instanceof BigUInt) === false) {
            return Result.error(
                ErrorCode.NOT_BIG_U_INT, 'values.toBlock'
            )
        }
        if (fromBlock.value > toBlock.value) {
            return Result.error(
                ErrorCode.BAD_RANGE, 'values.fromBlock and toBlock'
            )
        }
        addresses = addresses || []
        if (!Array.isArray(addresses)) {
            return Result.error(
                ErrorCode.NOT_ARRAY, 'values.addresses'
            )
        }
        for (let [i, v] of addresses.entries()) {
            if ((v instanceof Address) === false) {
                return Result.error(
                    ErrorCode.NOT_ADDRESS, `values.addresses[${i}]`
                )
            }
        }
        topics = topics || new LogTopicFilter()
        if ((topics instanceof LogTopicFilter) === false) {
            return Result.error(
                ErrorCode.NOT_LOG_TOPIC_FILTER, 'values.topics'
            )
        }
        let filter = new LogFilter({fromBlock, toBlock, addresses, topics})
        return Result.ok(filter)
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
     *
     * @param {object} values
     * @param {Address} values.address - Contract that emits log.
     * @param {BigUInt} values.blockNumber - Block number that contains log.
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
     * @param {object} values
     * @return {Result<Log>}
     */
    static fromRpcResult(values) {
        if (!isObject(values)) {
            return Result.error(ErrorCode.NOT_OBJECT, 'values')
        }
        let {error: e1, data: address} = Address.fromHeximal(values.address)
        if (e1 !== ErrorCode.NONE) {
            return Result.error(e1, 'values.address')
        }
        let {error: e2, data: blockNumber} = BigUInt.fromHeximal(
            values.blockNumber
        )
        if (e2 !== ErrorCode.NONE) {
            return Result.error(e2, 'values.blockNumber')
        }
        let {error: e3, data: logIndex} = UInt16.fromHeximal(values.logIndex)
        if (e3 !== ErrorCode.NONE) {
            return Result.error(e3, 'values.logIndex')
        }
        let {error: e4, data: transactionIndex} = UInt16.fromHeximal(
            values.transactionIndex
        )
        if (e4 !== ErrorCode.NONE) {
            return Result.error(e4, 'values.transactionIndex')
        }
        let {error: e5, data: topics} = LogTopicCombination.fromRpcResult(
            values.topics
        )
        if (e5 !== ErrorCode.NONE) {
            return Result.error(e5, 'values.topics')
        }
        let {error: e6, data: data} = ByteData.fromBadHeximal(values.data)
        if (e6 !== ErrorCode.NONE) {
            return Result.error(e6, 'values.data')
        }
        let {error: e7, data: blockHash} = ByteData32.fromHeximal(
            values.blockHash
        )
        if (e7 !== ErrorCode.NONE) {
            return Result.error(e7, 'values.blockHash')
        }
        let {error: e8, data: transactionHash} = ByteData32.fromHeximal(
            values.transactionHash
        )
        if (e8 !== ErrorCode.NONE) {
            return Result.error(e8, 'values.transactionHash')
        }
        let log = new Log({
            address, blockNumber, logIndex, transactionIndex, topics,
            data, blockHash, transactionHash
        })
        return Result.ok(log)
    }
}

/**
 * A list of logs and extra information.
 */
class LogSegment {
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

    /**
     *
     * @param {Array<Log>} items
     * @param {BigUInt} confirmedBlockNumber - The log segment ensures
     * correctness of `items` in range `[filter.fromBlock, confirmedBlock]`.
     * It does not contain items from remain range
     * `(confirmedBlock, filter.toBlock)`.
     */
    constructor(items, confirmedBlockNumber) {
        this._items = items
        this._confirmedBlockNumber = confirmedBlockNumber
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
 * @param {Heximal} value
 * @return {Array<number, number>} First item is number of significant heximal
 * digits, second item is first significant digit.
 */
function getHeximalLength(value) {
    for (let i = 2; i < value.length; ++i) {
        if (value[i] !== '0') {
            return [value.length - i, value[i]]
        }
    }
    return [0, undefined]
}

/**
 * Transform heximal to 53 bits unsigned integer number.
 *
 * @param {Heximal} value
 * @return {Result<number>}
 */
function heximalToUnsignedInteger(value) {
    if (!isHeximal(value)) {
        return Result.error(ErrorCode.NOT_HEXIMAL)
    }
    let [length, digit] = getHeximalLength(value)
    if (
        (length > 14) ||
        (length === 14 && digit > '1')
    ) {
        return Result.error(ErrorCode.OVERFLOW_U_INT)
    }
    let number = Number(value, 16)
    return Result.ok(number)
}

/**
 * Check a value is safe, unsigned, integer number in Javasript.
 *
 * @private
 * @param {number} value
 * @return {boolean}
 */
function isUnsignedInteger(value) {
    return Number.isInteger(value) &&
        (value >= 0) &&
        (value <= Number.MAX_SAFE_INTEGER)
}

/**
 * Check a value is big, unsigned, integer number.
 *
 * @private
 * @param {bigint} value
 * @return {boolean}
 */
function isBigUnsignedInteger(value) {
    return (typeof(value) === 'bigint') && (value >= 0)
}

/**
 *
 * @param {object} value
 * @return {boolean}
 */
function isObject(value) {
    return (typeof(value) === 'object') && (value !== null)
}

/**
 * @private
 * @param {any} value
 * @return {boolean}
 */
function isHeximal(value) {
    return /^0x[a-fA-F0-9]+$/.test(value)
}

/**
 *
 * @param {string | undefined} value
 * @return {boolean}
 */
function isOptionalString(value) {
    return (value === undefined) || (typeof value === 'string')
}

/**
 * @private
 * @param {Heximal} value
 * @return {Result<Buffer>}
 */
function heximalToBuffer(value) {
    if (!isHeximal(value)) {
        return Result.error(ErrorCode.NOT_HEXIMAL)
    }
    let hasEvenLength = (value.length % 2) === 0
    let evenHeximal = hasEvenLength
        ? value.slice(2)
        : '0' + value.slice(2)
    let buffer = Buffer.from(evenHeximal, 'hex')
    return Result.ok(buffer)
}

/**
 * @param {Heximal} value
 * @param {number} size - Number of bytes.
 * @return {Result<Buffer>}
 */
function heximalToFixedBuffer(value, size) {
    if (!isUnsignedInteger(size)) {
        return Result.error(ErrorCode.NOT_U_INT)
    }
    if (!isHeximal(value)) {
        return Result.error(ErrorCode.NOT_HEXIMAL)
    }
    let digits = value.slice(2)
    if (digits.length !== (2 * size)) {
        return Result.error(ErrorCode.NOT_ACCEPTED_SIZE)
    }
    let buffer = Buffer.from(digits, 'hex')
    return Result.ok(buffer)
}

/**
 *
 * @param {object} value
 * @param {Array<string>} acceptedAttributes
 * @return {Result<undefined>}
 */
function validateObject(value, acceptedAttributes = []) {
    if (typeof value !== 'object' || value === null) {
        return new Result(ErrorCode.NOT_OBJECT)
    }
    let attributes = Object.getOwnPropertyNames(value)
    let acceptedAttributeSet = new Set(acceptedAttributes)
    for (let attribute of attributes) {
        if (!acceptedAttributeSet.has(attribute)) {
            return new Result(
                ErrorCode.NOT_ACCEPTED_ATTRIBUTE, undefined, attribute
            )
        }
    }
    return new Result(ErrorCode.NONE)
}

module.exports = {
    ErrorCode,
    ResultError,
    Result,
    UInt,
    UInt16,
    BigUInt,
    Timestamp,
    Timespan,
    DataSize,
    ByteData,
    ByteData32,
    HttpUrl,
    HttpEndpoint,
    EndpointQuota,
    Address,
    Block,
    Transaction,
    LogTopicCombination,
    LogTopicFilter,
    LogFilter,
    Log,
    LogSegment,
    getInvertedObject,
    validateObject,
    heximalToFixedBuffer
}
