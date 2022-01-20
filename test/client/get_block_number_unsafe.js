'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {UInt64} = require('minitype')
const mockDate = require('mockdate')
const {Client} = require('../../lib/client')
const {NodeResponse} = require('../../lib/node')
const {
    Result,
    DataSize,
    Timestamp,
    Timespan,
    ByteData32,
    HttpUrl,
    EthEndpoint,
    Block
} = require('../../lib/type')

describe('Client.getBlockByNumberUnsafe', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return a block', async() => {
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
                }).open()
            ]
        }).open()
        let block = Block.create({
            number: UInt64.fromNumber(2).open(),
            timestamp: Timestamp.fromSeconds(1598671455).open(),
            transactions: [
                ByteData32.fromHeximal('0x1d06a9d52255a2a4385d55093aec7671f3d7f6d83d4cd438991be8b6588e9b91').open()
            ]
        }).open()
        let data = NodeResponse.create({
            data: block,
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(1668).open()
        }).open()
        let expectedResult = Result.ok(data)
        let actualResult = await client.getBlockByNumberUnsafe(block.number)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
