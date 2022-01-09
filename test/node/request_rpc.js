'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Node} = require('../../lib/node')
const {
    ErrorCode,
    Result,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestRpc', () => {
    it('method=eth_getBlockByNumber, params=["0x1b4", false]', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x1b4', false]
        let httpMock = new AxiosMock(node._httpClient)
        let httpBody = JSON.stringify({
            result: {
                number: '0x1b4'
            }
        })
        httpMock.onPost('/').reply(200, httpBody)
        let actualResult = await node._requestRpc(method, params)
        let expectedResult = Result.ok({number: '0x1b4'})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('method=undefined, params=undefined, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = undefined
        let params = undefined
        let httpMock = new AxiosMock(node._httpClient)
        let httpBody = JSON.stringify({
            error: {
                message: 'error message from server'
            }
        })
        httpMock.onPost('/').reply(200, httpBody)
        let actualResult = await node._requestRpc(method, params)
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_REQUEST, 'error message from server'
        )
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('method=eth_getTransactionByHash, params=undefined, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getTransactionByHash'
        let params = undefined
        let httpMock = new AxiosMock(node._httpClient)
        let httpBody = JSON.stringify({
            error: {
                message: 'error message from server'
            }
        })
        httpMock.onPost('/').reply(200, httpBody)
        let actualResult = await node._requestRpc(method, params)
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_REQUEST, 'error message from server'
        )
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('responds invalid JSON RPC data, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x357', false]
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '"this is invalid RPC response object"')
        let actualResult = await node._requestRpc(method, params)
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_RESPONSE, 'json rpc v2: invalid response'
        )
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
