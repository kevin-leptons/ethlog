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
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node.getBlockNumber', () => {
    it('return correct result', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x453'
        })
        httpMock.onPost('/').reply(200, responseBody)
        let blockNumber = new BigUInt(0x453n)
        let expectedResult = Result.ok(blockNumber)
        let actualResult = await node.getBlockNumber()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bad RPC data, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x'
        })
        httpMock.onPost('/').reply(200, responseBody)
        let expectedResult = Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad block number')
        let actualResult = await node.getBlockNumber()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
