'use strict'

const axios = require('axios')
const {
    DataError,
    NotExistedError,
    UInt,
    BigUInt,
    Timespan,
    DataSize,
    HttpEndpoint,
    Block,
    LogFilter,
    Log,
    TransactionHash,
    Transaction,
    assertConfigObject
} = require('./type')

/**
 * @readonly
 * @enum {number}
 */
const ErrorCode = {
    /**
     * There are no errors.
     */
    NONE: 0,

    /**
     * Client should reduce number of requests and data range to server.
     * This error is not always overload from server because there are no
     * explicit clues for confirmation. The reasons can be but not limit:
     * domain name does not exist, IP address is unreachable, server does
     * not serve anything, handshake failure, connection timeout, firewall
     * blocks requests, requests in long queue, server limits client requests.
     */
    IMPLICIT_TIMEOUT: 1,

    /**
     * Client should reduce number of requests and data range to server
     * immediately because server shows it clearly. This hint come from HTTP
     * layer by status code `429 - Too Many Requests` or
     * `503 - Service Unavailable`.
     */
    EXPLICIT_TIMEOUT: 2,

    /**
     * Server complains about request data from client because it does not
     * meet specifications. This error is internal of this library and must
     * be fix. If caller has nothing to deal with it then report error and
     * terminate process.
     */
    BAD_REQUEST: 3,

    /**
     * Server responds bad data which is not in specifications. It come from
     * both HTTP and JSON RPC layer. Client should try later and hope that
     * server is fixed.
     */
    BAD_RESPONSE: 4,

    /**
     * Server hints that there are errors occurs and it's unable to handle
     * it. Client should try later and hope that server is fixed.
     */
    BAD_SERVER: 5
}

/**
 * Additional data which is collect during interact with lower protocols.
 */
class Metadata {
    /**
     * @type {Timespan}
     */
    elapsedTime

    /**
     * @type {DataSize}
     */
    responseSize

    /**
     * @param {object} values
     * @param {Timespan} values.elapsedTime
     * @param {DataSize} values.responseSize
     */
    constructor(values) {
        this.elapsedTime = values.elapsedTime
        this.responseSize = values.responseSize
    }
}

/**
 * @template T
 */
class Result {
    /**
     * @readonly
     * @type {ErrorCode}
     */
    error

    /**
     * @readonly
     * @type {T}
     */
    data

    /**
     * @readonly
     * @type {Metadata}
     */
    metadata

    /**
     *
     * @param {ErrorCode} error
     * @param {T} data - Specific data from calls.
     * @param {Metadata} metadata
     */
    constructor(error, data, metadata) {
        this.error = error
        this.data = data
        this.metadata = metadata
    }
}

class Node {
    /**
     * Node
     */
    constructor() {}

    /**
     * @returns {Promise<Result<BigUInt>>}
     */
    async getBlockNumber() {
        return new Result(ErrorCode.IMPLICIT_TIMEOUT, 1212)
    }

    async getBlockByNumber() {}
}

module.exports = {
    Node,
    Result,
    ErrorCode
}
