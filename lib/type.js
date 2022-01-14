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
 */

const path = require('path')

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
    NONE: 0x0,
    TYPE_BAD: 0x0001,
    TYPE_U_INT: 0x0002,
    TYPE_U_INT_OVERFLOW: 0x0003,
    TYPE_U_INT_16_OVERFLOW: 0x0004,
    TYPE_BIG_U_INT: 0x0005,
    TYPE_OPTIONAL_STRING: 0x0006,
    TYPE_ARRAY: 0x0006,
    TYPE_OBJECT: 0x0007,
    TYPE_HEXIMAL: 0x0008,
    TYPE_BUFFER: 0x0009,
    TYPE_URL: 0x000a,
    TYPE_URL_STRING: 0x000b,
    TYPE_PROTOCOL_HTTP: 0x000c,
    TYPE_URL_NO_AUTHENTICATION: 0x000e,
    TYPE_TIMESPAN: 0x000f,
    TYPE_ARRAY_OR_BYTE_DATA_32: 0x0010,
    TYPE_BAD_SIZE: 0x0011,
    TYPE_BAD_RANGE: 0x0012,
    TYPE_HEXIMAL_16_BITS_OVERFLOW: 0x0013,
    TYPE_HEXIMAL_53_BITS_OVERFLOW: 0x0014,
    TYPE_BIG_P_INT: 0x0015,
    TYPE_BUFFER_32_BYTES: 0x0016,
    TYPE_HTTP_URL: 0x0017,
    TYPE_U_INT_64_OVERFLOW: 0x0018,
    TYPE_HEXIMAL_64_BITS_OVERFLOW: 0x0019,
    TYPE_MISSING: 0x001a,
    TYPE_UNKOWN_ATTRIBUTE: 0x001b,
    TYPE_DUPLICATED: 0x001c,
    TYPE_LOG_LEVEL: 0x001d,
    ETH_IMPLICIT_OVERLOADING: 0x010000,
    ETH_EXPLICIT_OVERLOADING: 0x010001,
    ETH_BAD_REQUEST: 0x010002,
    ETH_BAD_RESPONSE: 0x010003,
    ETH_BAD_SERVER: 0x010004,
    ETH_NO_BLOCK: 0x010005,
    ETH_NO_TRANSACTION: 0x010006,
    NODE_TIMESTAMP_LOCK: 0x01000001,
    NODE_REQUEST_QUOTA: 0x01000002,
    NODE_UNSAFE_BLOCK: 0x01000003,
    NODE_BAD_SERVER_LOCK: 0x01000004,
    NODE_BAD_RESPONSE_LOCK: 0x01000005,
    NODE_IMPLICIT_OVERLOADING_LOCK: 0x01000006,
    NODE_EXPLICIT_OVERLOADING_LOCK: 0x0001000007,
    GATEWAY_BAD_BACKEND: 0x0100000001,
    GATEWAY_NO_BACKEND: 0x0100000002
}
/**
 * @readonly
 */
const ErrorString = getInvertedObject(ErrorCode)

/**
 * Throw on `Result.open()` or `constructor()`.
 */
class ResultError extends Error {
    /**
     *
     * @param {ErrorCode} error
     * @param {string} hint
     */
    constructor(error, hint) {
        super(ErrorString[error] + ': ' + hint)
        this.error = error
        this.hint = hint
    }
}

/**
 * Result from construction, transform types.
 *
 * @template T - Type of returned data.
 * @template M [undefined] - Type of metadata.
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
    get hint() {
        return this._hint
    }

    /**
     * @type {M}
     */
    get metadata() {
        return this._metadata
    }

    /**
     *
     * @param {ErrorCode} error
     * @param {T} data
     * @param {string} hint
     * @param {M} metadata
     */
    constructor(
        error, data = undefined, hint = undefined, metadata = undefined
    ) {
        this._error = error
        this._data = data
        this._hint = hint
        this._metadata = metadata
    }

    /**
     * Force to retrieve data immediately without care about errors.
     *
     * **WARN** This method is design for using in situations such as constant
     * initializaiton, testing, examples or top layers handling. Do not love
     * this one for internal implementations because it breaks error context
     * and handling possibility.
     *
     * @return {T}
     * @throws {ResultError}
     */
    open() {
        let {error, hint, data} = this
        if (error) {
            throw new ResultError(error, this.errorString(), hint)
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
     * @param {M} metadata
     * @return {Result<T, M>}
     */
    static ok(data, metadata = undefined) {
        return new Result(ErrorCode.NONE, data, undefined, metadata)
    }

    /**
     *
     * @param {ErrorCode} code
     * @param {string} hint
     * @param {M} metadata
     * @return {Result<undefined>}
     */
    static error(code, hint, metadata = undefined) {
        return new Result(code, undefined, hint, metadata)
    }
}

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
    assert: function(value, hint) {
        if (
            !Number.isInteger(value) ||
            value < 0 || value > 4
        ) {
            throw new ResultError(ErrorCode.TYPE_LOG_LEVEL, hint)
        }
    },
    assertOptional: function(value, hint) {
        if (value !== undefined) {
            this.assert(value, hint)
        }
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
        if (!Number.isInteger(value) || value < 0) {
            throw new ResultError(ErrorCode.TYPE_U_INT)
        }
        if (value > Number.MAX_SAFE_INTEGER) {
            throw new ResultError(ErrorCode.TYPE_U_INT_OVERFLOW)
        }
        this._value = value
    }

    /**
     * 53 bits all set heximal: `0x1FFFFFFFFFFFFF`.
     *
     * @param {Heximal} value
     * @return {Result<UInt>}
     */
    static fromHeximal(value) {
        let r1 = heximalToUnsignedInteger(value)
        if (r1.error) {
            return r1
        }
        let {data: number} = r1
        let data = new UInt(number)
        return Result.ok(data)
    }
}

/**
 * Unsigned integer number, 16 bits.
 */
class UInt16 {
    /**
     * Unsigned integer, 16 bits.
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
        if (!Number.isInteger(value) || value < 0) {
            throw new ResultError(ErrorCode.TYPE_U_INT)
        }
        if (value > 0xffff) {
            throw new ResultError(ErrorCode.TYPE_U_INT_16_OVERFLOW)
        }
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<UInt16>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.TYPE_HEXIMAL)
        }
        let [length] = getHeximalLength(value)
        if (length > 4) {
            return Result.error(ErrorCode.TYPE_HEXIMAL_16_BITS_OVERFLOW)
        }
        let number = Number(value, 16)
        let data = new UInt16(number)
        return Result.ok(data)
    }
}

/**
 * Unsigned integer number, 64 bits.
 */
class UInt64 {
    /**
     * Unsigned integer, 64 bits.
     *
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
        if (
            typeof(value) !== 'bigint' ||
            value < 0
        ) {
            throw new ResultError(ErrorCode.TYPE_BIG_U_INT)
        }
        if (value > 0xffffffffffffffffn) {
            throw new ResultError(ErrorCode.TYPE_U_INT_64_OVERFLOW)
        }
        this._value = value
    }

    /**
     *
     * @return {Heximal}
     */
    toHeximal() {
        return '0x' + this._value.toString(16)
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<UInt16>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.TYPE_HEXIMAL)
        }
        let [length] = getHeximalLength(value)
        if (length > 16) {
            return Result.error(ErrorCode.TYPE_HEXIMAL_64_BITS_OVERFLOW)
        }
        let number = BigInt(value)
        let data = new UInt64(number)
        return Result.ok(data)
    }

    /**
     *
     * @param {number} value
     * @return {Result<UInt64>}
     */
    static fromNumber(value) {
        let r = validateUnsignedInteger(value)
        if (r.error) {
            return r
        }
        let bigint = BigInt(value)
        let data = new UInt64(bigint)
        return Result.ok(data)
    }
}

/**
 * Possitive integer number, 64 bits.
 */
class PInt64 {
    /**
     * Unsigned integer, 64 bits.
     *
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
        if (
            typeof(value) !== 'bigint' ||
            value <= 0
        ) {
            throw new ResultError(ErrorCode.TYPE_BIG_P_INT)
        }
        if (value > 0xffffffffffffffffn) {
            throw new ResultError(ErrorCode.TYPE_U_INT_64_OVERFLOW)
        }
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<UInt16>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.TYPE_HEXIMAL)
        }
        let [length] = getHeximalLength(value)
        if (length > 16) {
            return Result.error(ErrorCode.TYPE_HEXIMAL_64_BITS_OVERFLOW)
        }
        let number = BigInt(value)
        let data = new UInt64(number)
        return Result.ok(data)
    }
}

/**
 * Unix timestamp, 64 bits in miliseconds.
 */
class Timestamp {
    /**
     * Timestamp miliseconds.
     *
     * @type {bigint}
     */
    get value() {
        return this._value
    }

    /**
     * @param {bigint} value - Timestamp in miliseconds.
     */
    constructor(value) {
        let r = validateUInt64(value)
        if (r.error) {
            throw new ResultError(r.error, r.hint)
        }
        this._value = value
    }

    /**
     *
     * @return {Timestamp}
     */
    static now() {
        let miliseconds = Date.now()
        let bigint = BigInt(miliseconds)
        return new Timestamp(bigint)
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<Timestamp>}
     */
    static fromHeximal(value) {
        if (!isHeximal(value)) {
            return Result.error(ErrorCode.TYPE_HEXIMAL)
        }
        let [length] = getHeximalLength(value)
        if (length > 16) {
            return Result.error(ErrorCode.TYPE_HEXIMAL_64_BITS_OVERFLOW)
        }
        let number = BigInt(value)
        let data = new Timestamp(number)
        return Result.ok(data)
    }
}

/**
 * Time period, 53 bits.
 */
class Timespan {
    /**
     * Time period in miliseconds.
     *
     * @type {bigint}
     */
    get value() {
        return this._value
    }

    /**
     * @param {bigint} value - Time period in miliseconds.
     */
    constructor(value) {
        let r = validateUInt64(value)
        if (r.error) {
            throw new ResultError(r.error, r.hint)
        }
        this._value = value
    }

    /**
     * Time period in seconds.
     *
     * @return {string}
     */
    toHumanString() {
        let seconds = this._value / 1000n
        let miliseconds = this._value - 1000n * seconds
        let formatedMiliseconds = miliseconds.toString().padStart(3, '0')
        let minutes = seconds / 60n
        return `${minutes}:${seconds}.${formatedMiliseconds}`
    }

    /**
     * @param {bigint} value - Time period in seconds.
     * @return {Result<Timespan>}
     */
    static fromSeconds(value) {
        let r1 = validateUInt64(value)
        if (r1.error) {
            return r1
        }
        let miliseconds = 1000n * value
        let data = new Timespan(miliseconds)
        return Result.ok(data)
    }

    /**
     *
     * @param {number} value
     * @return {Result<Timespan>}
     */
    static fromNumber(value) {
        let r1 = validateUnsignedInteger(value)
        if (r1.error) {
            return r1
        }
        let bigint = BigInt(value)
        let data = new Timespan(bigint)
        return Result.ok(data)
    }

    /**
     *
     * @param {bigint} value - Time period in minutes.
     * @return {Result<Timespan>}
     */
    static fromMinutes(value) {
        let r1 = validateUInt64(value)
        if (r1.error) {
            return r1
        }
        let miliseconds = 1000n * 60n * value
        let data = new Timespan(miliseconds)
        return Result.ok(data)
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
        if (
            typeof(value) !== 'bigint' ||
            value < 0
        ) {
            throw new ResultError(ErrorCode.TYPE_BIG_U_INT)
        }
        this._value = value
    }

    /**
     * Size in megabyte.
     *
     * @return {number}
     */
    toHumanString() {
        let {_value: v} = this
        if (v < 0x400n) {
            return v + 'B'
        }
        else if (v > 0x400n && v < 0x100000n) {
            return (v / 0x400n) + 'KB'
        }
        else {
            let megabyte = v / 0x100000n
            let kilobyte = (v - 0x100000n * megabyte) / 0x400n
            return megabyte + '.' + kilobyte + 'MB'
        }
    }

    /**
     *
     * @param {number} number
     * @return {Result<DataSize>}
     */
    static fromNumber(number) {
        let r = validateUnsignedInteger(number)
        if (r.error) {
            return r
        }
        let bigint = BigInt(number)
        let data = new DataSize(bigint)
        return Result.ok(data)
    }

    /**
     *
     * @param {bigint} value
     * @return {Result<DataSize>}
     */
    static fromMegabytes(value) {
        let r = validateUInt64(value)
        if (r.error) {
            return r
        }
        let data = new DataSize(value * 0x100000n)
        return Result.ok(data)
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
     * @throws {Result}
     */
    constructor(value) {
        if ((value instanceof Buffer) === false) {
            throw new ResultError(ErrorCode.TYPE_BUFFER)
        }
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<ByteData>}
     */
    static fromHeximal(value) {
        let {error, data: buffer} = heximalToBuffer(value)
        if (error) {
            return Result.error(error)
        }
        let data = new ByteData(buffer)
        return Result.ok(data)
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
        let {error, data: buffer} = heximalToBuffer(heximal)
        if (error) {
            return Result.error(error)
        }
        let data = new ByteData(buffer)
        return Result.ok(data)
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
     * @throws {ResultError}
     */
    constructor(value) {
        if (
            (value instanceof Buffer) === false ||
            value.length !== 32
        ) {
            throw new ResultError(ErrorCode.TYPE_BUFFER_32_BYTES)
        }
        this._value = value
    }

    /**
     *
     * @param {Heximal} value
     * @return {Result<ByteData32>}
     */
    static fromHeximal(value) {
        let {error, data: buffer} = heximalToFixedBuffer(value, 32)
        if (error) {
            return Result.error(error)
        }
        let data = new ByteData32(buffer)
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
     *
     * @param {string} value
     * @throws {Result}
     */
    constructor(value) {
        let url = HttpUrl._parseUrl(value)
        if ((url.protocol !== 'http:') && (url.protocol !== 'https:')) {
            throw new ResultError(
                ErrorCode.TYPE_PROTOCOL_HTTP, 'expected: http or https'
            )
        }
        if (url.username || url.password) {
            throw new ResultError(
                ErrorCode.TYPE_URL_NO_AUTHENTICATION,
                'expected: no username or password'
            )
        }
        this._value = url
    }

    /**
     *
     * @param {string} value
     * @return {Result<HttpUrl>}
     * @throws {Error}
     */
    static fromString(value) {
        try {
            return new HttpUrl(value)
        }
        catch (error) {
            if (error instanceof Result) {
                return error
            }
            throw error
        }
    }

    /**
     * @private
     * @param {string} value
     * @return {URL}
     * @throws {ResultError}
     */
    static _parseUrl(value) {
        try {
            return new URL(value)
        }
        catch {
            throw new ResultError(ErrorCode.TYPE_URL_STRING)
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
     *
     * @param {object} values
     * @param {HttpUrl} values.url
     * @param {string} [values.username]
     * @param {string} [values.password]
     * @param {Timespan} [values.timeout]
     * @throws {Result}
     */
    constructor(values) {
        assertObjectAttributes(values, [
            'url', 'username', 'password', 'timeout'
        ])
        let {url, username, password, timeout} = values
        timeout = timeout || new Timespan(3000n)
        assertInstance(url, HttpUrl, 'url')
        assertOptionalString(username, 'username')
        assertOptionalString(password, 'password')
        assertInstance(timeout, Timespan, 'timeout')
        this._url = url
        this._username = username
        this._password = password
        this._timeout = timeout
    }
}

/**
 * Configuration for a ETH EthEndpoint.
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
     *
     * @param {object} values
     * @param {HttpUrl} values.url
     * @param {string} [values.username]
     * @param {string} [values.password]
     * @param {EndpointQuota} [values.quota]
     * @param {UInt64} [values.logSafeGap]
     * @param {UInt64} [values.logRangeBoundary] - Maximum of filter range
     * `[fromBlock, toBlock]` for calling to `getLogs()`.
     * @param {DataSize} [values.logSizeBorder] - Estimate next filter range
     * of `getLogs()` to keep returned data is less than or equal this one but
     * does not guarantee.
     * @param {Timespan} [values.logTimeBorder] - Estimate next filter range
     * of `getLogs()` to keep response time is less than or equal this one but
     * does not guarantee.
     * @param {UInt64} [values.logQuantityBorder] - Estimate next filter range
     * of `getLogs()` to keep returned quantities of log is less than or equal
     * this one but does not guarantee.
     * @throws {Result}
     */
    constructor(values) {
        assertInput(values, [
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
        let {
            url, username, password, quota, logSafeGap,
            logRangeBoundary, logSizeBorder, logTimeBorder, logQuantityBorder
        } = values
        this._url = url
        this._username = username
        this._password = password
        this._quota = quota || new EndpointQuota()
        this._logSafeGap = logSafeGap || new UInt64(15n)
        this._logRangeBoundary = logRangeBoundary || new UInt64(5n * 1000n)
        this._logSizeBorder = logSizeBorder || new DataSize(4n * 1024n ** 2n)
        this._logTimeBorder = logTimeBorder || new Timespan(5n * 1000n)
        this._logQuantityBorder = logQuantityBorder || new UInt64(10n * 1000n)
        this._timeout = new Timespan(this._logTimeBorder.value + 6n * 1000n)
    }

    /**
     *
     * @param {Array<EthEndpoint>} items
     * @param {string} hint
     * @throws {ResultError}
     */
    static assertUniqueItems(items, hint) {
        assertArray(items, hint)
        items.forEach((v, i) => {
            assertInstance(v, EthEndpoint, `${hint}[${i}]`)
        })
        let identities = items.map(EthEndpoint._getIdentity)
        let identitySet = new Set()
        for (let i = 0; i < identities.length; ++i) {
            if (identitySet.has(identities[i])) {
                throw new ResultError(
                    ErrorCode.TYPE_DUPLICATED, `${hint}[${i}]`
                )
            }
            identitySet.add(identities[i])
        }
    }

    /**
     * Ensure a endpoint is not duplicated for each lists.
     * Ensure a endpoint does not belong to both two lists.
     *
     * @param {Array<EthEndpoint>} list1
     * @param {Array<EthEndpoint>} list2
     * @param {string} hint
     * @throws {ResultError}
     */
    static assertUniqueLists(list1, list2, hint) {
        EthEndpoint.assertUniqueItems(list1, hint)
        EthEndpoint.assertUniqueItems(list2, hint)
        let set1 = new Set(
            list1.map(EthEndpoint._getIdentity)
        )
        let set2 = new Set(
            list2.map(EthEndpoint._getIdentity)
        )
        for (let k of set1.keys()) {
            if (set2.has(k)) {
                throw new ResultError(
                    ErrorCode.TYPE_DUPLICATED, `${hint}: ${k}`
                )
            }
        }
    }

    /**
     *
     * @param {EthEndpoint} endpoint
     * @return {string}
     */
    static _getIdentity(endpoint) {
        let {url: {value: url}} = endpoint
        return url.host + path.resolve(url.pathname)
    }
}

/**
 * Specific limits of a EthEndpoint.
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
     * @param {UInt} [values.batchLimit] - Maximum allowd number of request in
     * a timespan. If this value is set then `batchTimespan` must be set too.
     * If this value is not set then `batchTimespan` is ignored.
     * @param {Timespan} [values.batchTimespan] - How long a batch limit is
     * apply for in miliseconds.
     */
    constructor(values = {}) {
        assertObjectAttributes(values, ['batchLimit', 'batchTimespan'])
        let {batchLimit, batchTimespan} = values
        batchLimit = batchLimit || new UInt(20)
        batchTimespan = batchTimespan || new Timespan(60000n)
        assertInstance(batchLimit, UInt, 'batchLimit')
        assertInstance(batchTimespan, Timespan, 'batchTimespan')
        this._batchLimit = batchLimit
        this._batchTimespan = batchTimespan
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
        if ((value instanceof Buffer) === false) {
            throw new ResultError(ErrorCode.TYPE_BUFFER)
        }
        if (value.length !== 20) {
            throw new ResultError(ErrorCode.TYPE_BAD_SIZE, '20 bytes')
        }
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
        let r1 = heximalToFixedBuffer(value, 20)
        if (r1.error) {
            return r1
        }
        let {data: buffer} = r1
        let data = new Address(buffer)
        return Result.ok(data)
    }
}

/**
 * ETH block.
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
     *
     * @param {object} values
     * @param {UInt64} values.number
     * @param {Timestamp} values.timestamp
     * @param {Array<ByteData32>} values.transactions
     * @throws {Result}
     */
    constructor(values) {
        assertObjectAttributes(values, ['number', 'timestamp', 'transactions'])
        let {number, timestamp, transactions} = values
        assertInstance(number, UInt64, 'number')
        assertInstance(timestamp, Timestamp, 'timestamp')
        assertArray(transactions, 'transactions')
        transactions.forEach((item, index) => {
            assertInstance(item, ByteData32, `transactions[${index}]`)
        })
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
            return Result.error(ErrorCode.TYPE_OBJECT, 'values')
        }
        let {error: e1, data: number} = UInt64.fromHeximal(values.number)
        if (e1) {
            return Result.error(e1, 'number')
        }
        let {error: e2, data: timestamp} = Timestamp.fromHeximal(
            values.timestamp
        )
        if (e2) {
            return Result.error(e2, 'timestamp')
        }
        if (!Array.isArray(values.transactions)) {
            return Result.error(
                ErrorCode.TYPE_ARRAY, 'transactions'
            )
        }
        let transactions = []
        for (let [i, v] of values.transactions.entries()) {
            let {error: e3, data: tx} = ByteData32.fromHeximal(v)
            if (e3) {
                return Result.error(e3, `transactions[${i}]`)
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
     *
     * @param {object} values
     * @param {ByteData32} values.hash
     * @param {Address} values.from
     * @param {Address} values.to
     * @param {UInt64} values.blockNumber
     * @param {UInt16} values.transactionIndex
     */
    constructor(values) {
        assertObjectAttributes(values, [
            'hash', 'from', 'to', 'blockNumber', 'transactionIndex'
        ])
        let {hash, from, to, blockNumber, transactionIndex} = values
        assertInstance(hash, ByteData32, 'hash')
        assertInstance(from, Address, 'from')
        assertInstance(to, Address, 'to')
        assertInstance(blockNumber, UInt64, 'blockNumber')
        assertInstance(transactionIndex, UInt16, 'transactionIndex')
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
            return Result.error(ErrorCode.TYPE_OBJECT, 'values')
        }
        let {error: e1, data: hash} = ByteData32.fromHeximal(values.hash)
        if (e1) {
            return Result.error(e1, 'hash')
        }
        let {error: e2, data: from} = Address.fromHeximal(values.from)
        if (e2) {
            return Result.error(e2, 'from')
        }
        let {error: e3, data: to} = Address.fromHeximal(values.to)
        if (e3) {
            return Result.error(e3, 'to')
        }
        let {error: e4, data: blockNumber} = UInt64.fromHeximal(
            values.blockNumber
        )
        if (e4) {
            return Result.error(e4, 'blockNumber')
        }
        let {error: e5, data: transactionIndex} = UInt16.fromHeximal(
            values.transactionIndex
        )
        if (e5) {
            return Result.error(e5, 'transactionIndex')
        }
        let transaction = new Transaction({
            hash, from, to, blockNumber, transactionIndex
        })
        return Result.ok(transaction)
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
        assertArray(value)
        if (value.length > 4) {
            throw new ResultError(ErrorCode.TYPE_BAD_SIZE, 'at most 4')
        }
        value.forEach((v, i) => {
            assertInstance(v, ByteData32, `value[${i}]`)
        })
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
     * @param {Array<Heximal>} value
     * @return {Result<LogTopicCombination>}
     */
    static fromRpcResult(value) {
        if (!Array.isArray(value)) {
            return Result.error(ErrorCode.TYPE_ARRAY, 'value')
        }
        if (value.length > 4) {
            return Result.error(ErrorCode.TYPE_BAD_SIZE, 'expected: at most 4')
        }
        let topics = []
        for (let [i, v] of value.entries()) {
            let {error, data: topic} = ByteData32.fromHeximal(v)
            if (error) {
                return Result.error(error, `value: ${i}`)
            }
            topics.push(topic)
        }
        let combination = new LogTopicCombination(topics)
        return Result.ok(combination)
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
     *
     * @param {Array<ByteData32 | Array<ByteData32>>} value
     */
    constructor(value = []) {
        assertArray(value)
        if (value.length > 4) {
            throw new ResultError(ErrorCode.TYPE_BAD_SIZE, 'expected: <= 4')
        }
        for (let [i, v] of value.entries()) {
            if (!LogTopicFilter._isArrayOrByteData32(v)) {
                throw new ResultError(
                    ErrorCode.TYPE_ARRAY_OR_BYTE_DATA_32, `value[${i}]`
                )
            }
        }
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
     *
     * @param {object} values
     * @param {UInt64} values.fromBlock
     * @param {UInt64} values.toBlock
     * @param {Array<Address>} [values.addresses]
     * @param {LogTopicFilter} [values.topics]
     */
    constructor(values) {
        assertObjectAttributes(values, [
            'fromBlock', 'toBlock', 'addresses', 'topics'
        ])
        let {fromBlock, toBlock, addresses, topics} = values
        addresses = addresses || []
        topics = topics || new LogTopicFilter()
        assertInstance(fromBlock, UInt64, 'fromBlock')
        assertInstance(toBlock, UInt64, 'toBlock')
        assertArray(addresses)
        addresses.forEach((v, i) => {
            assertInstance(v, Address, `addresses[${i}]`)
        })
        assertInstance(topics, LogTopicFilter, 'topics')
        if (fromBlock.value > toBlock.value) {
            throw new ResultError(
                ErrorCode.TYPE_BAD_RANGE, 'expected: fromBlock > toBlock'
            )
        }
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
        assertObjectAttributes(values, [
            'address', 'blockNumber', 'logIndex', 'transactionIndex', 'topics',
            'data', 'blockHash', 'transactionHash'
        ])
        let {
            address, blockNumber, logIndex, transactionIndex,
            topics, data, blockHash, transactionHash
        } = values
        assertInstance(address, Address, 'address')
        assertInstance(blockNumber, UInt64, 'blockNumber')
        assertInstance(logIndex, UInt16, 'logIndex')
        assertInstance(transactionIndex, UInt16, 'transactionIndex')
        assertInstance(topics, LogTopicCombination, 'topics')
        assertInstance(data, ByteData, 'data')
        assertInstance(blockHash, ByteData32, 'blockHash')
        assertInstance(transactionHash, ByteData32, 'transactionHash')
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
            return Result.error(ErrorCode.TYPE_OBJECT, 'values')
        }
        let {error: e1, data: address} = Address.fromHeximal(values.address)
        if (e1) {
            return Result.error(e1, 'address')
        }
        let {error: e2, data: blockNumber} = UInt64.fromHeximal(
            values.blockNumber
        )
        if (e2) {
            return Result.error(e2, 'blockNumber')
        }
        let {error: e3, data: logIndex} = UInt16.fromHeximal(values.logIndex)
        if (e3) {
            return Result.error(e3, 'logIndex')
        }
        let {error: e4, data: transactionIndex} = UInt16.fromHeximal(
            values.transactionIndex
        )
        if (e4) {
            return Result.error(e4, 'transactionIndex')
        }
        let {error: e5, data: topics} = LogTopicCombination.fromRpcResult(
            values.topics
        )
        if (e5) {
            return Result.error(e5, 'topics')
        }
        let {error: e6, data: data} = ByteData.fromBadHeximal(values.data)
        if (e6) {
            return Result.error(e6, 'data')
        }
        let {error: e7, data: blockHash} = ByteData32.fromHeximal(
            values.blockHash
        )
        if (e7) {
            return Result.error(e7, 'blockHash')
        }
        let {error: e8, data: transactionHash} = ByteData32.fromHeximal(
            values.transactionHash
        )
        if (e8) {
            return Result.error(e8, 'transactionHash')
        }
        let log = new Log({
            address, blockNumber, logIndex, transactionIndex, topics,
            data, blockHash, transactionHash
        })
        return Result.ok(log)
    }
}

class BigMath {
    /**
     *
     * @param {...bigint} values
     * @return {bigint}
     * @throws {ResultError}
     */
    static min(...values) {
        if (values.length <= 0) {
            throw new ResultError(
                ErrorCode.TYPE_MISSING, 'expect at least one'
            )
        }
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
     * @throws {ResultError}
     */
    static max(...values) {
        if (values.length <= 0) {
            throw new ResultError(
                ErrorCode.TYPE_MISSING, 'expect at least one'
            )
        }
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
 * Validate object attributes by type.
 *
 * @param {object} target
 * @param {Array<string, Function, boolean>} specs - First item is attribute
 * name, second one is type, last one is set mean optional attrbiute.
 */
function assertInput(target, specs) {
    let attributes = specs.map(spec => spec[0])
    assertObjectAttributes(target, attributes)
    for (let [name, type, optional] of specs) {
        let value = target[name]
        if (optional) {
            assertOptionalInstance(value, type, name)
        }
        else {
            assertInstance(value, type, name)
        }
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
        return Result.error(ErrorCode.TYPE_HEXIMAL)
    }
    let [length, digit] = getHeximalLength(value)
    if (
        (length > 14) ||
        (length === 14 && digit > '1')
    ) {
        return Result.error(ErrorCode.TYPE_HEXIMAL_53_BITS_OVERFLOW)
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
 * @private
 * @param {Heximal} value
 * @return {Result<Buffer>}
 */
function heximalToBuffer(value) {
    if (!isHeximal(value)) {
        return Result.error(ErrorCode.TYPE_HEXIMAL)
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
        return Result.error(ErrorCode.TYPE_U_INT)
    }
    if (!isHeximal(value)) {
        return Result.error(ErrorCode.TYPE_HEXIMAL)
    }
    let digits = value.slice(2)
    if (digits.length !== (2 * size)) {
        return Result.error(ErrorCode.TYPE_BAD_SIZE, `${size} bytes`)
    }
    let buffer = Buffer.from(digits, 'hex')
    return Result.ok(buffer)
}

/**
 *
 * @param {number} value
 * @return {Result}
 */
function validateUnsignedInteger(value) {
    if (!Number.isInteger(value) || value < 0) {
        return Result.error(ErrorCode.TYPE_U_INT)
    }
    if (value > Number.MAX_SAFE_INTEGER) {
        return Result.error(ErrorCode.TYPE_U_INT_OVERFLOW)
    }
    return Result.ok()
}

/**
 *
 * @param {bigint} value
 * @return {Result<undefined>}
 */
function validateUInt64(value) {
    if (
        typeof(value) !== 'bigint' ||
        value < 0
    ) {
        return Result.error(ErrorCode.TYPE_BIG_U_INT)
    }
    if (value > 0xffffffffffffffffn) {
        return Result.error(ErrorCode.TYPE_U_INT_64_OVERFLOW)
    }
    return Result.ok()
}

/**
 *
 * @param {object} value
 * @param {Array<string>} acceptedAttributes
 * @return {Result<undefined>}
 */
function validateObjectAttributes(value, acceptedAttributes = []) {
    if (typeof value !== 'object' || value === null) {
        return Result.error(ErrorCode.TYPE_OBJECT)
    }
    let attributes = Object.getOwnPropertyNames(value)
    let acceptedAttributeSet = new Set(acceptedAttributes)
    for (let attribute of attributes) {
        if (!acceptedAttributeSet.has(attribute)) {
            return Result.error(
                ErrorCode.TYPE_UNKOWN_ATTRIBUTE, attribute
            )
        }
    }
    return Result.ok(ErrorCode.NONE)
}

/**
 *
 * @param {object} value
 * @param {Array<string>} attributes - Accepted attributes.
 * @throws {ResultError}
 */
function assertObjectAttributes(value, attributes = []) {
    let {error, hint} = validateObjectAttributes(value, attributes)
    if (error) {
        throw new ResultError(error, hint)
    }
}

/**
 *
 * @param {string | undefined} value
 * @param {string} hint
 * @throws {Result}
 */
function assertOptionalString(value, hint = '_') {
    if (typeof(value) === 'string' || value === undefined) {
        return
    }
    throw new ResultError(ErrorCode.TYPE_OPTIONAL_STRING, hint)
}

/**
 *
 * @param {any} value
 * @param {Function} type
 * @param {string} identity
 * @throws {Result}
 */
function assertInstance(value, type, identity) {
    if (
        typeof(type) === 'string' &&
        typeof(value) !== type
    ) {
        throw new ResultError(
            ErrorCode.TYPE_BAD, `${identity} must be ${type}`
        )
    }
    if ((value instanceof type) === false) {
        throw new ResultError(
            ErrorCode.TYPE_BAD, `${identity} must be ${type.name}`
        )
    }
}

/**
 *
 * @param {any} value
 * @param {Function} type
 * @param {string} identity
 * @throws {Result}
 */
function assertOptionalInstance(value, type, identity) {
    if (value === undefined) {
        return
    }
    if (typeof(type) === 'string') {
        if (typeof(value) !== type) {
            throw new ResultError(
                ErrorCode.TYPE_BAD, `${identity} must be ${type}`
            )
        }
    }
    else if ((value instanceof type) === false) {
        throw new ResultError(
            ErrorCode.TYPE_BAD, `${identity} must be ${type.name}`
        )
    }
}

/**
 *
 * @param {Array} value
 * @param {string} hint
 * @throws {ResultError}
 */
function assertArray(value, hint) {
    if (!Array.isArray(value)) {
        throw new ResultError(ErrorCode.TYPE_ARRAY, hint)
    }
}

/**
 *
 * @param {Array} value
 * @param {string} hint
 * @throws {ResultError}
 */
function assertNotEmptyArray(value, hint) {
    assertArray(value, hint)
    if (value.length <= 0) {
        throw new ResultError(
            ErrorCode.TYPE_BAD_SIZE, '>= 1'
        )
    }
}

/**
 *
 * @param {Array} value
 * @param {string} hint
 */
function assertOptionalArray(value, hint) {
    if (value === undefined) {
        return
    }
    assertArray(value, hint)
}

module.exports = {
    LogLevel,
    ErrorCode,
    ErrorString,
    ResultError,
    Result,
    UInt,
    UInt16,
    UInt64,
    PInt64,
    Timestamp,
    Timespan,
    DataSize,
    ByteData,
    ByteData32,
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
    validateObjectAttributes,
    heximalToFixedBuffer,
    assertObjectAttributes,
    assertInstance,
    assertOptionalInstance,
    assertInput,
    assertArray,
    assertNotEmptyArray,
    assertOptionalArray
}
