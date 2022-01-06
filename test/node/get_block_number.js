'use strict'

const assert = require('assert')
const {Node} = require('../../lib/node')
const {
    UInt,
    UBigInt,
    SafeHttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node.getBlockNumber', () => {
    let node
    before(() => {
        node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return UBigInt', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof UBigInt, true)
    })
})
