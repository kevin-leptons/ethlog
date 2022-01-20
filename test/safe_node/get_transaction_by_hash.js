'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {UInt64, UInt16, Timespan, DataSize} = require('minitype')
const {log} = require('stdio_log')
const mockDate = require('mockdate')
const {SafeNode} = require('../../lib/safe_node')
const {NodeResponse} = require('../../lib/node')
const {
    Result,
    ByteData32,
    Address,
    HttpUrl,
    EthEndpoint,
    Transaction
} = require('../../lib/type')

describe('SafeNode.getTransactionByHash', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return a transaction', async() => {
        let node = SafeNode.create({
            endpoint: EthEndpoint.create({
                url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
            }).open(),
            log: log
        }).open()
        let transaction = new Transaction({
            hash: ByteData32.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f').open(),
            from: Address.fromHeximal('0xe2d3a739effcd3a99387d015e260eefac72ebea1').open(),
            to: Address.fromHeximal('0x0000000000000000000000000000000000001000').open(),
            blockNumber: UInt64.fromNumber(13495100).open(),
            transactionIndex: UInt16.fromNumber(368).open()
        })
        let data = NodeResponse.create({
            data: transaction,
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(691).open()
        }).open()
        let expectedResult = Result.ok(data)
        let actualResult = await node.getTransactionByHash(transaction.hash)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
