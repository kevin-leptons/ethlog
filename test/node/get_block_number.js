'use strict'

const assert = require('assert')
const {Node} = require('../../lib/node')
const {UBigInt} = require('../../lib/type')

describe('Node.getBlockNumber', () => {
    let node
    before(() => {
        node = new Node({
            identity: 1,
            endpoint: 'https://bsc-dataseed.binance.org'
        })
    })
    it('return UBigInt', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof UBigInt, true)
    })
})
