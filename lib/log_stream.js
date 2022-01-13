'use strict'

const {delay} = require('@trop/gear')
const {Client} = require('./client')
const {Metadata} = require('./safe_node')
const {
    LogLevel,
    UInt64,
    Timespan,
    Address,
    Endpoint,
    LogTopicFilter,
    LogFilter,
    Log,
    assertObjectAttributes,
    assertInstance,
    assertOptionalInstance,
    assertNotEmptyArray,
    assertOptionalArray
} = require('./type')

/**
 * @name LogHandler
 * @function
 * @param {Array<Log>} logs
 * @param {Metadata | undefined} metadata
 * @param {Client} client
 * @return {Promise<undefined>}
 */

/**
 * Accept a handler for processing log records, segment by segment. Behind
 * scence, it does all complex, dirty work to solve Ethereum JSON RPC issues.
 */
class LogStream {
    /**
     *
     * @param {object} config
     * @param {LogHandler} config.handler - A function that receives and
     * processes logs.
     * @param {Array<Endpoint>} config.mainEndpoints - Fetching log records
     * from these Ethereum JSON RPC.
     * @param {Array<Endpoint>} [config.backupEndpoints] - These endpoints is
     * use in case all `mainEndpoints` is failed.
     * @param {UInt64} [config.fromBlock] - Start fetching log records from
     * this block.
     * @param {Array<Address>} [config.addresses] - Filter log records which
     * is emit by these addresses.
     * @param {LogTopicFilter} [config.topics] - Filter log records which is
     * matched with these topics.
     * @param {Timespan} [config.interval] - Relax duration between two
     * fetching.
     * @param {LogLevel} [config.logLevel]
     */
    constructor(config) {
        LogStream._assertConstruction(config)
        let {
            handler, mainEndpoints, backupEndpoints, fromBlock,
            addresses, topics, interval, logLevel
        } = config
        this._handler = handler
        this._client = new Client({
            mainEndpoints: mainEndpoints,
            backupEndpoints: backupEndpoints,
            logLevel: logLevel
        })
        this._fromBlock = fromBlock || new UInt64(0n)
        this._addresses = addresses || []
        this._topics = topics || new LogTopicFilter()
        this._interval = interval
            ? Number(interval.value)
            : Number(Timespan.fromSeconds(6n).open().value)
        this._readerBlockNumber = new UInt64(fromBlock.value)
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
                this._log.error(r1.reason)
            }
            if (r2.status === 'rejected') {
                this._log.error(r2.reason)
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
     */
    async _readLogs() {
        if (this._readerOutput !== undefined) {
            return
        }
        let filter = new LogFilter({
            fromBlock: this._readerBlockNumber,
            toBlock: new UInt64(this._readerBlockNumber.value + 200n),
            addresses: this._addresses,
            topics: this._topics
        })
        let result = await this._client.getLogs(filter)
        if (result.error) {
            this._log.error(result.errorString(), result.hint)
            return
        }
        let {confirmedBlockNumber} = result.metadata
        this._readerOutput = result
        this._readerBlockNumber = new UInt64(confirmedBlockNumber.value + 1n)
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
            this._processorInput.data,
            this._processorInput.metadata,
            this._client
        )
        this._processorInput = undefined
    }

    /**
     *
     * @param {object} config - Configuration from constructor.
     */
    static _assertConstruction(config) {
        assertObjectAttributes(config, [
            'handler', 'mainEndpoints', 'backupEndpoints', 'fromBlock',
            'addresses', 'topics', 'interval', 'logLevel'
        ])
        let {
            handler, mainEndpoints, backupEndpoints, fromBlock,
            addresses, topics, interval, logLevel
        } = config
        assertInstance(handler, Function, 'handler')
        assertNotEmptyArray(mainEndpoints, 'mainEndpoints')
        Endpoint.assertUniqueItems(mainEndpoints, 'mainEndpoints')
        if (backupEndpoints) {
            Endpoint.assertUniqueItems(backupEndpoints, 'backupEndpoints')
        }
        Endpoint.assertUniqueLists(
            mainEndpoints, backupEndpoints || [],
            'mainEndpoints and backupEndpoints'
        )
        assertOptionalInstance(fromBlock, UInt64, 'fromBlock')
        assertOptionalArray(addresses, 'addresses')
        addresses.forEach((v, i) => {
            assertInstance(v, Address, `addresses[${i}]`)
        })
        assertOptionalInstance(topics, LogTopicFilter, 'topics')
        assertOptionalInstance(interval, Timespan, 'interval')
        LogLevel.assertOptional(logLevel, 'logLevel')
    }
}

module.exports = {
    LogStream
}
