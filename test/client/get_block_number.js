'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const mockDate = require('mockdate')
const {Client} = require('../../lib/client')
const {NodeResponse} = require('../../lib/node')
const {
    Result,
    HttpUrl,
    EthEndpoint
} = require('../../lib/type')

describe('Client.getBlockNumber', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return block number', async() => {
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
                }).open()
            ]
        }).open()
        let actualResult = await client.getBlockNumber()
        assert.strictEqual(actualResult instanceof Result, true)
        let {error, data: nodeResponse} = actualResult
        assert.strictEqual(error, undefined)
        assert.strictEqual(nodeResponse instanceof NodeResponse, true)
    })
})
