'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const {Log: StdioLog} = require('stdio_log')
const assert = require('assert')
const {UInt, UInt64, Timespan} = require('minitype')
const {SafeNode} = require('../../lib/safe_node')
const {
    Result,
    HttpUrl,
    EthEndpoint,
    Address,
    ByteData32,
    LogTopicFilter,
    LogFilter,
    EndpointQuota
} = require('../../lib/type')

describe('SafeNode.getLogs', () => {
    let node = SafeNode.create({
        endpoint: EthEndpoint.create({
            url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open(),
            quota: EndpointQuota.create({
                batchLimit: UInt.fromNumber(60).open(),
                batchTimespan: Timespan.fromSeconds(60).open()
            }).open()
        }).open(),
        log: new StdioLog()
    }).open()
    it('return a log segment', async() => {
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(14098157).open(),
            toBlock: UInt64.fromNumber(14098157).open(),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
            ],
            topics: LogTopicFilter.create([
                ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
            ]).open()
        }).open()
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult instanceof Result, true)
        assert.strictEqual(actualResult.error, undefined)
        let {data: nodeResponse} = actualResult
        let {data: logSegment} = nodeResponse
        assert.strictEqual(logSegment.logs.length, 1)
    })
})
