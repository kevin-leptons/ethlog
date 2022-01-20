'use strict'

const {delay} = require('@trop/gear')
const {log} = require('stdio_log')
const {
    UInt64,
    Timespan,
    validateInstanceMap, validateArrayItems
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
     * Consider using {@link LogStream.create} for initialization.
     *
     * @param {object} config
     * @param {LogHandler} config.handler - A function that receives and
     * processes logs.
     * @param {Client} config.client
     * @param {UInt64} config.fromBlock - Start fetching log records from
     * this block.
     * @param {Array<Address>} config.addresses - Filter log records which
     * is emit by these addresses.
     * @param {LogTopicFilter} config.topics - Filter log records which is
     * matched with these topics.
     * @param {Timespan} config.interval - Relax duration between two
     * fetching.
     */
    constructor(config) {
        let {
            handler, client, fromBlock,
            addresses, topics, interval
        } = config
        this._handler = handler
        this._client = client
        this._fromBlock = fromBlock
        this._addresses = addresses
        this._topics = topics
        this._interval = interval.value
        this._readerBlockNumber = this._fromBlock.clone()
        this._logRange = UInt64.fromNumber(5000).open()
    }

    /**
     *
     * @param {object} config
     * @param {LogHandler} config.handler - A function that receives and
     * processes logs.
     * @param {client} config.client
     * @param {UInt64} [config.fromBlock] - Start fetching log records from
     * this block.
     * @param {Array<Address>} [config.addresses] - Filter log records which
     * is emit by these addresses.
     * @param {LogTopicFilter} [config.topics] - Filter log records which is
     * matched with these topics.
     * @param {Timespan} [config.interval] - Relax duration between two
     * fetching.
     * @return {Result<TypeError, LogStream>}
     */
    static create(config) {
        let r1 = validateInstanceMap(config, [
            ['handler', Function], ['client', Client],
            ['fromBlock', UInt64, true],
            ['addresses', Array, true], ['topics', LogTopicFilter, true],
            ['interval', Timespan, true]
        ])
        if (r1.error) {
            return r1
        }
        let {
            handler, client, fromBlock, addresses, topics, interval
        } = config
        addresses = addresses || []
        let r2 = validateArrayItems(addresses, Address)
        if (r2.error) {
            return r2
        }
        interval = interval || Timespan.fromSeconds(6).open()
        let data = new LogStream({
            handler, client, log, fromBlock, addresses, topics, interval
        })
        return Result.ok(data)
    }

    /**
     * Start fetching and processing log records.
     *
     * @return {Promise<undefined>}
     */
    async start() {
        this._readerOutput = undefined
        this._processorInput = undefined
        for (;;) {
            let [r1, r2] = await Promise.allSettled([
                this._readLogs(),
                this._processLogs()
            ])
            if (r1.status === 'rejected') {
                log.error(r1.reason)
            }
            if (r2.status === 'rejected') {
                log.error(r2.reason)
            }
            if (this._processorInput === undefined) {
                this._processorInput = this._readerOutput
                this._readerOutput = undefined
            }
            await delay(this._interval)
        }
    }

    /**
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
            log.error(r1.error.message, r1.error.data || '_')
            return
        }
        let {data: nodeResponse} = r1
        let {data: logSegment} = nodeResponse
        this._readerOutput = logSegment
        this._readerBlockNumber = logSegment.toBlock.addNumber(1)
    }

    /**
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
}

module.exports = {
    LogStream
}
