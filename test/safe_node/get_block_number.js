'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const {log} = require('stdio_log')
const assert = require('assert')
const {
    UInt,
    Timespan
} = require('minitype')
const {NodeResponse} = require('../../lib/node')
const {SafeNode} = require('../../lib/safe_node')
const {
    Result,
    HttpUrl,
    EthEndpoint,
    EndpointQuota
} = require('../../lib/type')

describe('SafeNode.getBlockNumber', () => {
    let node = SafeNode.create({
        endpoint: EthEndpoint.create({
            url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open(),
            quota: EndpointQuota.create({
                batchLimit: UInt.fromNumber(60).open(),
                batchTimespan: Timespan.fromSeconds(60).open()
            }).open()
        }).open(),
        log: log
    }).open()
    it('return block number', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof Result, true)
        let {error, data: nodeResponse} = actualResult
        assert.strictEqual(error, undefined)
        assert.strictEqual(nodeResponse instanceof NodeResponse, true)
    })
})
