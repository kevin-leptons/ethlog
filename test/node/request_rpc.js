'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const mockDate = require('mockdate')
const {Timespan, DataSize} = require('minitype')
const {Node, RpcResponse, JsonResponse} = require('../../lib/node')
const {
    Result,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')
const {
    NODE_BAD_REQUEST,
    NODE_BAD_RESPONSE
} = require('../../lib/type').ErrorCode

describe('Node._requestRpc', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('response valid RPC data', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x1b4', false]
        let httpMock = new AxiosMock(node._httpClient)
        let httpResponseBody = JSON.stringify({
            result: {
                number: '0x1b4'
            }
        })
        httpMock.onPost('/').reply(200, httpResponseBody)
        let rpcResponse = new RpcResponse({
            data: {
                number: '0x1b4'
            },
            size: DataSize.fromBytes(29).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.ok(rpcResponse)
        let actualResult = await node._requestRpc(method, params)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respnose error message, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = undefined
        let params = undefined
        let httpMock = new AxiosMock(node._httpClient)
        let httpResponseBody = JSON.stringify({
            error: {
                message: 'error message from server'
            }
        })
        httpMock.onPost('/').reply(200, httpResponseBody)
        let jsonResponse = new JsonResponse({
            data: {
                error: {
                    message: 'error message from server'
                }
            },
            size: DataSize.fromBytes(49).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_REQUEST, 'error message from server', jsonResponse
        )
        let actualResult = await node._requestRpc(method, params)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('response no error or result, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x357', false]
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '{}')
        let jsonResponse = new JsonResponse({
            data: {},
            size: DataSize.fromBytes(2).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_RESPONSE, 'no error or result from RPC', jsonResponse
        )
        let actualResult = await node._requestRpc(method, params)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
