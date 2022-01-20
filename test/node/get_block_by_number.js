'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {UInt64, Timespan, Timestamp, DataSize} = require('minitype')
const mockDate = require('mockdate')
const {Node, NodeResponse, RpcResponse} = require('../../lib/node')
const {
    Result,
    HttpUrl,
    HttpEndpoint,
    ByteData32,
    Block
} = require('../../lib/type')
const {
    NODE_NO_BLOCK,
    NODE_BAD_RESPONSE
} = require('../../lib/type').ErrorCode

describe('Node.getBlockByNumber', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return a block', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('http://0.0.0.0').open()
            }).open()
        }).open()
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: {
                number: '0xCD5DA5',
                timestamp: '0x61B82374',
                transactions: [
                    '0xabe913f1c2dfe5a759e301d6d27e20766a78fc11a4e0298a6a50c52ff06e95bb'
                ]
            }
        })
        httpMock.onPost('/').reply(200, responseBody)
        let block = new Block({
            number: UInt64.fromNumber(13458853).open(),
            timestamp: Timestamp.fromSeconds(0x61B82374).open(),
            transactions: [
                ByteData32.fromHeximal('0xabe913f1c2dfe5a759e301d6d27e20766a78fc11a4e0298a6a50c52ff06e95bb').open()
            ]
        })
        let data = NodeResponse.create({
            data: block,
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(143).open()
        }).open()
        let expectedResult = Result.ok(data)
        let actualResult = await node.getBlockByNumber(block.number)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('block is not existed, return error', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('http://0.0.0.0').open()
            }).open()
        }).open()
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: null
        })
        httpMock.onPost('/').reply(200, responseBody)
        let expectedResult = Result.badError(
            NODE_NO_BLOCK, 'missing or not mined yet'
        )
        let blockNumber = UInt64.fromBigInt(0xffffffffffffffn).open()
        let actualResult = await node.getBlockByNumber(blockNumber)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bad RPC data, return error', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('http://0.0.0.0').open()
            }).open()
        }).open()
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x'
        })
        httpMock.onPost('/').reply(200, responseBody)
        let rpcResponse = RpcResponse.create({
            data: '0x',
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(15).open()
        }).open()
        let expectedResult = Result.badError(
            NODE_BAD_RESPONSE, 'expect an object', rpcResponse
        )
        let blockNumber = UInt64.fromNumber(0xff).open()
        let actualResult = await node.getBlockByNumber(blockNumber)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
