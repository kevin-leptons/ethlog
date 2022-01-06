'use strict'

/* eslint-disable max-len */

const assert = require('assert')
const {Node} = require('../../lib/node')
const {
    UInt,
    UInt16,
    UBigInt,
    TransactionHash,
    Address,
    SafeHttpUrl,
    HttpEndpoint,
    Transaction
} = require('../../lib/type')

describe('Node.getTransactionByHash', () => {
    let node
    before(() => {
        node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return a transaction', async() => {
        let hash = TransactionHash.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f')
        let actualResult = await node.getTransactionByHash(hash)
        let expectedResult = new Transaction({
            hash: TransactionHash.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f'),
            from: Address.fromHeximal('0xe2d3a739effcd3a99387d015e260eefac72ebea1'),
            to: Address.fromHeximal('0x0000000000000000000000000000000000001000'),
            blockNumber: new UBigInt(13495100),
            transactionIndex: new UInt16(368)
        })
        assert.strictEqual(actualResult instanceof Transaction, true)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
