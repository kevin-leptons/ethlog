'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const {Log: StdioLog} = require('stdio_log')
const assert = require('assert')
const {SafeNode} = require('../../lib/safe_node')
const {
    ErrorCode,
    Result,
    UInt,
    UInt64,
    Timespan,
    HttpUrl,
    Endpoint,
    EndpointQuota
} = require('../../lib/type')

describe('SafeNode.getBlockNumber', () => {
    let node
    before(() => {
        node = new SafeNode({
            endpoint: new Endpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org'),
                quota: new EndpointQuota({
                    batchLimit: new UInt(10000),
                    batchTimespan: new Timespan(300000n)
                })
            }),
            log: new StdioLog()
        })
    })
    it('return block number', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof Result, true)
        assert.strictEqual(actualResult.error, ErrorCode.NONE)
        assert.strictEqual(actualResult.data instanceof UInt64, true)
    })
})
