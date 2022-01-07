'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {ProtocolError, Node} = require('../../lib/node')
const {
    UInt,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestRpc', () => {
    it('method=eth_getBlockByNumber, params=["0x1b4", false]', async() => {
        let node = new Node({
            identity: new UInt(1),
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
        assert.strictEqual(actualResult.number, '0x1b4')
    })
    it('method=undefined, params=undefined, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = undefined
        let params = undefined
        let httpMock = new AxiosMock(node._httpClient)
        let httpBody = JSON.stringify({
            error: {
                message: 'invalid request'
            }
        })
        httpMock.onPost('/').reply(200, httpBody)
        await assert.rejects(
            () => node._requestRpc(method, params),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_REQUEST,
                message: 'invalid request'
            }
        )
    })
    it('method=eth_getTransactionByHash, params=undefined, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getTransactionByHash'
        let params = undefined
        let httpMock = new AxiosMock(node._httpClient)
        let httpBody = JSON.stringify({
            error: {
                message: 'missing value for required argument 0'
            }
        })
        httpMock.onPost('/').reply(200, httpBody)
        await assert.rejects(
            () => node._requestRpc(method, params),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_REQUEST,
                message: 'missing value for required argument 0'
            }
        )
    })
    it('responds invalid JSON RPC data, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x357', false]
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '"this is invalid RPC response object"')
        await assert.rejects(
            () => node._requestRpc(method, params),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_RESPONSE,
                message: 'server responds invalid JSON RPC'
            }
        )
    })
})
