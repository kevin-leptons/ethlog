'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {ProtocolError, Node} = require('../../lib/node')
const {
    UInt,
    BigUInt,
    HttpUrl,
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
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            }),
            timeout: new UInt(6000)
        })
    })
    it('filtered, return a log', async() => {
        let filter = new LogFilter({
            fromBlock: new BigUInt(14098157),
            toBlock: new BigUInt(14098157),
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
    it('no address and topic filter, return logs', async() => {
        let filter = new LogFilter({
            fromBlock: new BigUInt(14127894),
            toBlock: new BigUInt(14127894)
        })
        let logs = await node.getLogs(filter)
        assert.strictEqual(Array.isArray(logs), true)
        assert.strictEqual(logs.length, 494)
    })
    it('return no logs because of not existed address', async() => {
        let randomAddress = Address.fromHeximal('0x5e985727192314df7749976bfe4785a000908715')
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(0),
            addresses: [
                randomAddress
            ]
        })
        let logs = await node.getLogs(filter)
        assert.strictEqual(Array.isArray(logs), true)
        assert.strictEqual(logs.length, 0)
    })
    it('return no logs because of not existed topic', async() => {
        let randomTopic = LogTopic.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398')
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(0),
            topics: new LogTopicFilter([
                randomTopic
            ])
        })
        let logs = await node.getLogs(filter)
        assert.strictEqual(Array.isArray(logs), true)
        assert.strictEqual(logs.length, 0)
    })
    it('responds out of range, throws error', async() => {
        let randomTopic = LogTopic.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398')
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(5001),
            topics: new LogTopicFilter([
                randomTopic
            ])
        })
        await assert.rejects(
            () => node.getLogs(filter),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_REQUEST,
                message: 'exceed maximum block range: 5000'
            }
        )
    })
})
