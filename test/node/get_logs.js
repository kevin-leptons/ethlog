'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Node} = require('../../lib/node')
const {
    ErrorCode,
    Result,
    UInt16,
    BigUInt,
    ByteData,
    ByteData32,
    HttpUrl,
    HttpEndpoint,
    Address,
    LogTopicCombination,
    LogTopicFilter,
    LogFilter,
    Log
} = require('../../lib/type')

describe('Node.getLogs', () => {
    it('filtered, return a log', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: [
                {
                    address: '0xe56db5cd954774478dd59b889bbd7b7d4d1f3b00',
                    blockNumber: '0x123',
                    logIndex: '0x321',
                    transactionIndex: '0x54',
                    topics: [
                        '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'
                    ],
                    data: '0x',
                    blockHash: '0x75994653ace9123068017f67b72c660d05cc011caced9fa2edc73f82114440f4',
                    transactionHash: '0x6c08b5ef6a44c677216e971c38b6d273ba38875d98b27127dd61bb3366cafef2'
                }
            ]
        })
        httpMock.onPost('/').reply(200, responseBody)
        let filter = new LogFilter({
            fromBlock: new BigUInt(14098157),
            toBlock: new BigUInt(14098157),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
            ],
            topics: new LogTopicFilter([
                ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
            ])
        })
        let logs = [
            new Log({
                address: Address.fromHeximal('0xe56db5cd954774478dd59b889bbd7b7d4d1f3b00').open(),
                blockNumber: new BigUInt(0x123n),
                logIndex: new UInt16(0x321),
                transactionIndex: new UInt16(0x54),
                topics: new LogTopicCombination([
                    ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
                ]),
                data: ByteData.fromBadHeximal('0x').open(),
                blockHash: ByteData32.fromHeximal('0x75994653ace9123068017f67b72c660d05cc011caced9fa2edc73f82114440f4').open(),
                transactionHash: ByteData32.fromHeximal('0x6c08b5ef6a44c677216e971c38b6d273ba38875d98b27127dd61bb3366cafef2').open()
            })
        ]
        let expectedResult = Result.ok(logs)
        let actualResult = await node.getLogs(filter)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('no address and topic filter, return logs', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
        let filter = new LogFilter({
            fromBlock: new BigUInt(14127894n),
            toBlock: new BigUInt(14127894n)
        })
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult.error, ErrorCode.NONE)
        assert.strictEqual(Array.isArray(actualResult.data), true)
        assert.strictEqual(actualResult.data.length, 494)
    })
    it('return no logs because of not existed address', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
        let randomAddress = Address.fromHeximal('0x5e985727192314df7749976bfe4785a000908715').open()
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(0),
            addresses: [
                randomAddress
            ]
        })
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult.error, ErrorCode.NONE)
        assert.strictEqual(Array.isArray(actualResult.data), true)
        assert.strictEqual(actualResult.data.length, 0)
    })
    it('return no logs because of not existed topic', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
        let randomTopic = ByteData32.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398').open()
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(0),
            topics: new LogTopicFilter([
                randomTopic
            ])
        })
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult.error, ErrorCode.NONE)
        assert.strictEqual(Array.isArray(actualResult.data), true)
        assert.strictEqual(actualResult.data.length, 0)
    })
    it('responds out of range, throws error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
        let randomTopic = ByteData32.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398').open()
        let filter = new LogFilter({
            fromBlock: new BigUInt(0),
            toBlock: new BigUInt(5001),
            topics: new LogTopicFilter([
                randomTopic
            ])
        })
        let expectedResult = Result.error(ErrorCode.ETH_BAD_REQUEST, 'exceed maximum block range: 5000')
        let actualResult = await node.getLogs(filter)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
