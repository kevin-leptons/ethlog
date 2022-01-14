'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const {Log: StdioLog} = require('stdio_log')
const assert = require('assert')
const {SafeNode} = require('../../lib/safe_node')
const {
    Result,
    UInt,
    UInt64,
    Timespan,
    HttpUrl,
    EthEndpoint,
    Address,
    ByteData32,
    LogTopicFilter,
    LogFilter,
    EndpointQuota
} = require('../../lib/type')

describe('SafeNode.getLogs', () => {
    let node
    before(() => {
        node = new SafeNode({
            endpoint: new EthEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org'),
                quota: new EndpointQuota({
                    batchLimit: new UInt(10000),
                    batchTimespan: new Timespan(300000n)
                })
            }),
            log: new StdioLog()
        })
    })
    it('return a log segment', async() => {
        let filter = new LogFilter({
            fromBlock: new UInt64(14161978n),
            toBlock: new UInt64(14162978n),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
            ],
            topics: new LogTopicFilter([
                ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
            ])
        })
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult instanceof Result, true)
    })
})
