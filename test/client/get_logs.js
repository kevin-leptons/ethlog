'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {UInt64} = require('minitype')
const {Client} = require('../../lib/client')
const {
    Result,
    HttpUrl,
    EthEndpoint,
    Address,
    ByteData32,
    LogTopicFilter,
    LogFilter
} = require('../../lib/type')

describe('Client.getLogs', () => {
    it('return a log segment', async() => {
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
                }).open()
            ]
        }).open()
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
        let actualResult = await client.getLogs(filter)
        assert.strictEqual(actualResult instanceof Result, true)
        assert.strictEqual(actualResult.error, undefined)
        let {data: nodeResponse} = actualResult
        let {data: logSegment} = nodeResponse
        assert.strictEqual(logSegment.logs.length, 1)
    })
})
