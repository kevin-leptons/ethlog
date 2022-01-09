'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Node} = require('../../lib/node')
const {TrackedNode} = require('../../lib/tracked_node')
const {
    UInt,
    BigUInt,
    HttpUrl,
    HttpEndpoint,
    Address,
    LogTopic,
    LogTopicFilter,
    LogFilter,
    EndpointQuota,
    LogSegment
} = require('../../lib/type')

describe.skip('TrackedNode.getLogs', () => {
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
    it('filtered, return a log', async() => {
        let filter = new LogFilter({
            fromBlock: new BigUInt(14161978),
            toBlock: new BigUInt(14162978),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6')
            ],
            topics: new LogTopicFilter([
                LogTopic.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822')
            ])
        })
        let logSegment = await node.getLogs(filter)
        console.log(logSegment);
        assert.strictEqual(logSegment instanceof LogSegment, true)
        assert.strictEqual(logSegment.items.length, 1)
    })
})
