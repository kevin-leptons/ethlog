'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Node} = require('../../lib/node')
const {
    ErrorCode,
    Result,
    BigUInt,
    Timestamp,
    HttpUrl,
    HttpEndpoint,
    ByteData32,
    Block
} = require('../../lib/type')

describe('Node.getBlockByNumber', () => {
    it('return a block', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
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
            number: new BigUInt(13458853n),
            timestamp: new Timestamp(0x61B82374),
            transactions: [
                ByteData32.fromHeximal('0xabe913f1c2dfe5a759e301d6d27e20766a78fc11a4e0298a6a50c52ff06e95bb').open()
            ]
        })
        let expectedResult = Result.ok(block)
        let actualResult = await node.getBlockByNumber(block.number)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('block is not existed, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: null
        })
        httpMock.onPost('/').reply(200, responseBody)
        let blockNumber = new BigUInt(0xffffffffffffffn)
        let expectedResult = Result.error(ErrorCode.ETH_NO_BLOCK, 'missing or not mined yet')
        let actualResult = await node.getBlockByNumber(blockNumber)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bad RPC data, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let blockNumber = new BigUInt(0x1n)
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x'
        })
        httpMock.onPost('/').reply(200, responseBody)
        let expectedResult = Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad block')
        let actualResult = await node.getBlockByNumber(blockNumber)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
