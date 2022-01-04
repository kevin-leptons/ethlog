'use strict'

const assert = require('assert')
const {Node} = require('../../lib/node')

describe('Node.getBlockNumber', () => {
    let node
    before(() => {
        node = new Node({
            identity: 1,
            endpoint: 'https://bsc-dataseed.binance.org'
        })
    })
    it('return list of logs', async () => {
        let logs = await node.getLogs({
            fromBlock: 13458853,
            toBlock: 13458853,
            addresses: [
                '0x804678fa97d91b974ec2af3c843270886528a9e6'
            ]
        })

        assert.strictEqual(Array.isArray(logs), true)
    })
})
