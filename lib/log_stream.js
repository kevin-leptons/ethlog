'use strict'

const {delay} = require('@trop/gear')
const {
    UInt64, Timespan,
    validateInstanceMap, validateArrayItems, validateInstance
} = require('minitype')
const {Client} = require('./client')
const {LogSegment} = require('./safe_node')
const {
    Result,
    Address,
    LogTopicFilter,
    LogFilter
} = require('./type')

/**
 * @name LogHandler
 * @function
 * @param {LogSegment} logs
 * @param {Client} client
 * @return {Promise<undefined>}
 */

const TIMESPAN_ZERO = Timespan.fromSeconds(0).open()

/**
 * Accept a handler for processing log records, segment by segment. Behind
 * scence, it does all complex, dirty work to solve Ethereum JSON RPC issues.
 */
class LogStream {
    /**
     * Start fetching logs from this block, inclusive.
     *
     * @type {UInt64}
     */
    get fromBlock() {
        return this._fromBlock
    }

    /**
     * Initialize by {@link LogStream.create}.
     *
     * @param {object} config
     * @param {Client} config.client
     * @param {UInt64} config.fromBlock
     * @param {Array<Address>} config.addresses
     * @param {LogTopicFilter} config.topics
     * @param {Timespan} config.idleTimespan
     */
    constructor(config) {
        let {client, fromBlock, addresses, topics, idleTimespan} = config
        this._client = client
        this._log = client.log
        this._fromBlock = fromBlock
        this._addresses = addresses
        this._topics = topics
        this._idleTimespan = idleTimespan
        this._readerBlockNumber = this._fromBlock.clone()
        this._logRange = UInt64.fromNumber(5000).open()
    }

    /**
     *
     * @param {object} config
     * @param {client} config.client
     * @param {UInt64} [config.fromBlock=0] - Start fetching log records from
     * this block.
     * @param {Array<Address>} [config.addresses=[]] - Filter log records which
     * is emit by these addresses.
     * @param {LogTopicFilter} [config.topics=LogTopicFilter()] - Filter log
     * records which is matched with these topics.
     * @param {Timespan} [config.idleTimespan=6] - On error or there is no safe
     * block, procesing is suspend for a moment.
     * @return {Result<TypeError, LogStream>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['client', Client],
            ['fromBlock', UInt64, true],
            ['addresses', Array, true], ['topics', LogTopicFilter, true],
            ['idleTimespan', Timespan, true]
        ])
        if (r1.error) {
            return r1
        }
        let {client, fromBlock, addresses, topics, idleTimespan} = config
        addresses = addresses || []
        let r2 = validateArrayItems(addresses, Address)
        if (r2.error) {
            return r2
        }
        topics = topics || LogTopicFilter.create().open()
        idleTimespan = idleTimespan || Timespan.fromSeconds(6).open()
        let data = new LogStream({
            client, fromBlock, addresses, topics, idleTimespan
        })
        return Result.ok(data)
    }

    /**
     * Start fetching and processing log records.
     *
     * @param {LogHandler} handler - A function that receives and
     * processes logs.
     * @return {Promise<undefined>}
     */
    async start(handler) {
        validateInstance(handler, Function).open()
        if (this._handler) {
            throw new Error('stream is already started')
        }
        this._handler = handler
        this._readerOutput = undefined
        this._processorInput = undefined
        for (;;) {
            let [r1, r2] = await Promise.allSettled([
                this._readLogs(),
                this._processLogs()
            ])
            if (r1.status === 'rejected') {
                this._log.error(r1.reason)
            }
            if (r2.status === 'rejected') {
                this._log.error(r2.reason)
            }
            await this._idle(r1, r2)
            this._pushDataToProcessor()
        }
    }

    /**
     * Retrieve log records and put result to `_clientError`, `_readerOutput`
     * and `_readerBlockNumber`.
     *
     * @private
     * @throws {Error}
     */
    async _readLogs() {
        if (this._readerOutput !== undefined) {
            return
        }
        let filter = LogFilter.create({
            fromBlock: this._readerBlockNumber,
            toBlock: this._readerBlockNumber.add(this._logRange),
            addresses: this._addresses,
            topics: this._topics
        }).open()
        let r1 = await this._client.getLogs(filter)
        if (r1.error) {
            this._log.error(r1.error.message, r1.error.data || '_')
            this._clientError = r1.error
            return
        }
        let {data: nodeResponse} = r1
        let {data: logSegment} = nodeResponse
        this._clientError = undefined
        this._readerOutput = logSegment
        this._readerBlockNumber = logSegment.toBlock.addNumber(1)
    }

    /**
     * If there is data from `_processorInput` then call `_handler`.
     *
     * @private
     */
    async _processLogs() {
        if (this._processorInput === undefined) {
            return
        }
        await this._handler(
            this._processorInput,
            this._client
        )
        this._processorInput = undefined
    }

    /**
     * Suspend processing for a moment or not, depend on result of reader and
     * processor.
     *
     * @private
     * @param {object} readerResult - Outcome object from `Promise`.
     * @param {object} processorResult
     */
    async _idle(readerResult, processorResult) {
        let moment = this._evaluateIdleMoment(readerResult, processorResult)
        let {value: miliseconds} = moment
        if (miliseconds > 0) {
            this._log.info('idle for', moment.format())
            await delay(miliseconds)
        }
    }

    /**
     * @private
     * @param {object} readerResult - Outcome object from `Promise`.
     * @param {object} processorResult
     * @return {Timespan}
     */
    _evaluateIdleMoment(readerResult, processorResult) {
        if (
            readerResult.status === 'rejected' ||
            processorResult.status === 'rejected' ||
            this._clientError !== undefined
        ) {
            return this._idleTimespan
        }
        if (this._readerOutput === undefined) {
            return TIMESPAN_ZERO
        }
        let {safeBlock} = this._readerOutput
        if (this._readerBlockNumber.lt(safeBlock)) {
            return TIMESPAN_ZERO
        }
        return this._idleTimespan
    }

    /**
     * @private
     */
    _pushDataToProcessor() {
        if (this._processorInput !== undefined) {
            return
        }
        this._processorInput = this._readerOutput
        this._readerOutput = undefined
    }
}

module.exports = {
    LogStream
}
