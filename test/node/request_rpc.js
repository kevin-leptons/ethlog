'use strict'

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {NodeError, Node} = require('../../lib/node')
const {
    UInt,
    SafeHttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestRpc', () => {
    it('method=eth_getBlockByNumber, params=["0x1b4", false]', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
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
    it('method=undefined, params=undefined, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
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
                name: 'NodeError',
                code: NodeError.CODE_RPC_BAD_REQUEST,
                message: 'invalid request'
            }
        )
    })
    it('method=eth_getTransactionByHash, params=undefined, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
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
                name: 'NodeError',
                code: NodeError.CODE_RPC_BAD_REQUEST,
                message: 'missing value for required argument 0'
            }
        )
    })
    it('node responds non 2xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x357', false]
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(400, 'bad request')
        await assert.rejects(
            () => node._requestRpc(method, params),
            {
                name: 'NodeError',
                code: NodeError.CODE_RPC_BAD_REQUEST,
                message: 'status=400'
            }
        )
    })
    it('node serves invalid JSON RPC response, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let method = 'eth_getBlockByNumber'
        let params = ['0x357', false]
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '"this is invalid JSON object"')
        await assert.rejects(
            () => node._requestRpc(method, params),
            {
                name: 'NodeError',
                code: NodeError.CODE_RPC_BAD_REQUEST,
                message: 'not an object: body'
            }
        )
    })
})
