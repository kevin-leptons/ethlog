'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {TrackedNode} = require('../../lib/tracked_node')
const {
    ErrorCode,
    Result,
    UInt,
    BigUInt,
    HttpUrl,
    HttpEndpoint,
    Address,
    ByteData32,
    LogTopicFilter,
    LogFilter,
    EndpointQuota,
    LogSegment
} = require('../../lib/type')

describe('TrackedNode.getLogs', () => {
    let node
    before(() => {
        node = new TrackedNode({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            }),
            quota: new EndpointQuota({
                batchLimit: new UInt(10000),
                batchTimespan: new UInt(300000)
            }),
            timeout: new UInt(6000)
        })
    })
    it('return a log segment', async() => {
        let filter = new LogFilter({
            fromBlock: BigUInt.fromNumber(14161978).open(),
            toBlock: BigUInt.fromNumber(14162978).open(),
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
