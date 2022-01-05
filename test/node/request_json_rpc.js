'use strict'

const assert = require('assert')
const {Node} = require('../../lib/node')

describe('Node._requestJsonRpc', () => {
    let node
    before(() => {
        node = new Node({
            identity: 1,
            endpoint: 'https://bsc-dataseed.binance.org'
        })
    })
    it('try eth_getBlockByNumber', async() => {
        let method = 'eth_getBlockByNumber'
        let params = ['0x1b4', false]
        let actualResult = await node._requestJsonRpc(method, params)
        assert.strictEqual(actualResult.number, '0x1b4')
    })
})
