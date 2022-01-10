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
    LogTopic,
    LogTopicFilter,
    LogFilter,
    EndpointQuota,
    LogSegment
} = require('../../lib/type')

describe('TrackedNode.getBlockNumber', () => {
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
    it('return block number', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof Result, true)
        assert.strictEqual(actualResult.error, ErrorCode.NONE)
        assert.strictEqual(actualResult.data instanceof BigUInt, true)
    })
})
