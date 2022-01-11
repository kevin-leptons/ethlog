'use strict'

let log = require('stdio_log')
const {delay} = require('@trop/gear')
const {Client} = require('./client')
const {Metadata} = require('./safe_node')
const {
    UInt64,
    Timespan,
    Address,
    LogTopicFilter,
    LogFilter,
    Log,
    assertObjectAttributes,
    assertInstance
} = require('./type')

/**
 * @name LogHandler
 * @function
 * @param {Array<Log>} logs
 * @param {Metadata | undefined} metadata
 * @returns {Promise<undefined>}
 */

class LogStream {
    /**
     *
     * @param {object} config
     * @param {Client} config.client
     * @param {LogHandler} config.handler
     * @param {UInt64} [config.fromBlock]
     * @param {Array<Address>} [config.addresses]
     * @param {LogTopicFilter} [config.topics]
     * @param {Timespan} [config.interval]
     */
    constructor(config) {
        assertObjectAttributes(config, [
            'client', 'handler', 'fromBlock', 'addresses', 'topics',
            'interval'
        ])
        let {
            client, handler, fromBlock, addresses, topics, interval
        } = config
        fromBlock = fromBlock || new UInt64(0n)
        addresses = addresses || []
        topics = topics || new LogTopicFilter()
        interval = interval || new Timespan(6000)
        assertInstance(client, Client, 'client')
        assertInstance(handler, Function, 'handler')
        assertInstance(fromBlock, UInt64, 'fromBlock')
        assertInstance(topics, LogTopicFilter, 'topics')
        assertInstance(interval, Timespan, 'interval')
        this._client = client
        this._handler = handler
        this._fromBlock = fromBlock
        this._addresses = addresses
        this._topics = topics
        this._interval = interval
        this._readerBlockNumber = new UInt64(fromBlock.value)
        this._readerOutput = undefined
        this._processorInput = undefined
    }

    /**
     * @returns {Promise<undefined>}
     */
    async start() {
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
            await delay(this._interval.value)
        }
    }

    async _readLogs() {
        if (this._readerOutput !== undefined) {
            return
        }
        let filter = new LogFilter({
            fromBlock: this._readerBlockNumber,
            toBlock: new UInt64(this._readerBlockNumber.value + 4999n),
            addresses: this._addresses,
            topics: this._topics
        })
        let result = await this._client.getLogs(filter)
        if (result.error) {
            log.error(result.errorString(), result.hint)
            return
        }
        let {confirmedBlockNumber} = result.metadata
        this._readerOutput = result
        this._readerBlockNumber = new UInt64(confirmedBlockNumber.value + 1n)
    }

    async _processLogs() {
        if (this._processorInput === undefined) {
            return
        }
        await this._handler(
            this._processorInput.data, this._processorInput.metadata
        )
        this._processorInput = undefined
    }
}

module.exports = {
    LogStream
}
