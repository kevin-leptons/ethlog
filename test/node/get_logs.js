'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {UInt16, UInt64, Timespan, DataSize} = require('minitype')
const mockDate = require('mockdate')
const {Node, NodeResponse} = require('../../lib/node')
const {
    Result,
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
const {
    NODE_BAD_REQUEST
} = require('../../lib/type').ErrorCode

describe('Node.getLogs', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return a log', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('http://0.0.0.0').open()
            }).open()
        }).open()
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
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(14098157).open(),
            toBlock: UInt64.fromNumber(14098157).open(),
            addresses: [
                Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
            ],
            topics: LogTopicFilter.create([
                ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
            ]).open()
        }).open()
        let logs = [
            new Log({
                address: Address.fromHeximal('0xe56db5cd954774478dd59b889bbd7b7d4d1f3b00').open(),
                blockNumber: UInt64.fromNumber(0x123).open(),
                logIndex: UInt16.fromNumber(0x321).open(),
                transactionIndex: UInt16.fromNumber(0x54).open(),
                topics: new LogTopicCombination([
                    ByteData32.fromHeximal('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822').open()
                ]),
                data: ByteData.fromHeximal('0x').open(),
                blockHash: ByteData32.fromHeximal('0x75994653ace9123068017f67b72c660d05cc011caced9fa2edc73f82114440f4').open(),
                transactionHash: ByteData32.fromHeximal('0x6c08b5ef6a44c677216e971c38b6d273ba38875d98b27127dd61bb3366cafef2').open()
            })
        ]
        let data = NodeResponse.create({
            data: logs,
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(396).open()
        }).open()
        let expectedResult = Result.ok(data)
        let actualResult = await node.getLogs(filter)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('no address and topic filter, return logs', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
            }).open()
        }).open()
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(1412789).open(),
            toBlock: UInt64.fromNumber(1412789).open()
        }).open()
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult.error, undefined)
        let {data: nodeResponse} = actualResult
        let {data: logs} = nodeResponse
        assert.strictEqual(Array.isArray(logs), true)
        assert.strictEqual(logs.length, 14)
    })
    it('return no logs because of not existed address', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
            }).open()
        }).open()
        let randomAddress = Address.fromHeximal('0x5e985727192314df7749976bfe4785a000908715').open()
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(0).open(),
            toBlock: UInt64.fromNumber(0).open(),
            addresses: [
                randomAddress
            ]
        }).open()
        let nodeResponse = NodeResponse.create({
            data: [],
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(36).open()
        }).open()
        let expectedResult = Result.ok(nodeResponse)
        let actualResult = await node.getLogs(filter)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('return no logs because of not existed topic', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
            }).open()
        }).open()
        let randomTopic = ByteData32.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398').open()
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(0).open(),
            toBlock: UInt64.fromNumber(0).open(),
            topics: LogTopicFilter.create([
                randomTopic
            ]).open()
        }).open()
        let nodeResponse = NodeResponse.create({
            data: [],
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(36).open()
        }).open()
        let expectedResult = Result.ok(nodeResponse)
        let actualResult = await node.getLogs(filter)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('responds out of range, throws error', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
            }).open()
        }).open()
        let randomTopic = ByteData32.fromHeximal('0x2a41ddd08781e68b373a0872bbac4e7ae7aaeea0d02b7b107351f5e0f771a398').open()
        let filter = LogFilter.create({
            fromBlock: UInt64.fromNumber(0).open(),
            toBlock: UInt64.fromNumber(5001).open(),
            topics: LogTopicFilter.create([
                randomTopic
            ]).open()
        }).open()
        let expectedResult = Result.badError(
            NODE_BAD_REQUEST,
            'exceed maximum block range: 5000'
        )
        let actualResult = await node.getLogs(filter)
        assert.strictEqual(actualResult.error.code, expectedResult.error.code)
        assert.strictEqual(actualResult.error.messsage, expectedResult.error.messsage)
    })
})
