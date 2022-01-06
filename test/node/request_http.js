'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {NodeError, Node} = require('../../lib/node')
const {
    UInt,
    SafeHttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestHttp', () => {
    it('IP address that does not listen, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://0.0.0.0')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'connect ECONNREFUSED 0.0.0.0:80'
            }
        )
    })
    it('IP address which is unable to touch, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://172.1.2.3')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'timeout of 3000ms exceeded'
            }
        )
    })
    it('not existed domain, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('https://foo.bar')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'getaddrinfo ENOTFOUND foo.bar'
            }
        )
    })
    it('timeout, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://0.0.0.0')
            }),
            timeout: new UInt(1000)
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').timeout()
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'timeout of 1000ms exceeded'
            }
        )
    })
    it('other network issues, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://0.0.0.0')
            }),
            timeout: new UInt(1000)
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').networkError()
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_OTHER,
                message: 'Network Error'
            }
        )
    })
    it('respond 1xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(100, 'foo.bar')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_OTHER,
                message: 'response status: 100'
            }
        )
    })
    it('respond 4xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(400, 'bad request')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_BAD_REQUEST,
                message: 'bad request data'
            }
        )
    })
    it('respond 5xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(500, 'foo.bar')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_BAD_SERVER,
                message: 'bad server status'
            }
        )
    })
    it('respond invalid JSON format from body, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '{invalid: json_format}')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_BAD_RESPONSE,
                message: 'invalid JSON format from response body'
            }
        )
    })
    it('respond status 429, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(429)
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_OVERLOAD,
                message: 'server overload'
            }
        )
    })
    it('respond status 503, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(503)
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_HTTP_OVERLOAD,
                message: 'server overload'
            }
        )
    })
})
