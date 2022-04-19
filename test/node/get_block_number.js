'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const mockDate = require('mockdate')
const AxiosMock = require('axios-mock-adapter')
const {
    UInt64,
    Timespan,
    DataSize
} = require('minitype')
const {Node, NodeResponse, RpcResponse} = require('../../lib/node')
const {
    Result,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')
const {
    NODE_BAD_RESPONSE
} = require('../../lib/type').ErrorCode

describe('Node.getBlockNumber', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('return correct result', async() => {
        let node = Node.create({
            endpoint: HttpEndpoint.create({
                url: HttpUrl.fromString('http://0.0.0.0').open()
            }).open()
        }).open()
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x453'
        })
        httpMock.onPost('/').reply(200, responseBody)
        let blockNumber = UInt64.fromNumber(0x453).open()
        let data = NodeResponse.create({
            data: blockNumber,
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(18).open()
        }).open()
        let expectedResult = Result.ok(data)
        let actualResult = await node.getBlockNumber()
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
        let rpcResponse = new RpcResponse({
            data: '0x',
            time: Timespan.fromMiliseconds(0).open(),
            size: DataSize.fromBytes(15).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_RESPONSE, 'expect Heximal', rpcResponse
        )
        let actualResult = await node.getBlockNumber()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
