'use strict'

/* eslint-disable max-len */

const assert = require('assert')
const {Node} = require('../../lib/node')
const {
    UInt,
    UBigInt,
    SafeHttpUrl,
    HttpEndpoint,
    Address,
    LogTopic,
    LogTopicFilter,
    LogFilter
} = require('../../lib/type')

describe('Node.getLogs', () => {
    let node
    before(() => {
        node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return list of logs', async() => {
        let filter = new LogFilter({
            fromBlock: new UBigInt(14098157),
            toBlock: new UBigInt(14098157),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6')
            ],
            topics: new LogTopicFilter([
                LogTopic.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822')
            ])
        })
        let logs = await node.getLogs(filter)
        assert.strictEqual(Array.isArray(logs), true)
        assert.strictEqual(logs.length, 1)
    })
})
