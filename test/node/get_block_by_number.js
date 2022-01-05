'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Node} = require('../../lib/node')
const {
    UBigInt,
    Timestamp,
    TransactionHash,
    Block
} = require('../../lib/type')

describe('Node.getBlockByNumber', () => {
    let node
    before(() => {
        node = new Node({
            identity: 1,
            endpoint: 'https://bsc-dataseed.binance.org'
        })
    })
    it('return a block', async() => {
        let number = new UBigInt(13458853)
        let block = await node.getBlockByNumber(number)
        assert.strictEqual(block instanceof Block, true)
        assert.deepStrictEqual(block.number, number)
        assert.deepStrictEqual(block.timestamp, new Timestamp(1639457652))
        assert.deepStrictEqual(
            block.transactions[0],
            TransactionHash.fromHeximal('0xabe913f1c2dfe5a759e301d6d27e20766a78fc11a4e0298a6a50c52ff06e95bb')
        )
    })
    it('invalid block number, throws error', async() => {
        let number = '123'
        await assert.rejects(
            () => node.getBlockByNumber(number),
            {
                name: 'DataError',
                message: 'not a UBigInt: blockNumber'
            }
        )
    })
})
