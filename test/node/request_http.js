'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {ProtocolError, Node} = require('../../lib/node')
const {
    UInt,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestHttp', () => {
    it('IP address that does not listen, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_IMPLICIT_OVERLOAD,
                message: 'connect ECONNREFUSED 0.0.0.0:80'
            }
        )
    })
    it('IP address which is unable to touch, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://172.1.2.3')
            }),
            timeout: new UInt(1000)
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_IMPLICIT_OVERLOAD,
                message: 'timeout of 1000ms exceeded'
            }
        )
    })
    it('not existed domain, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://foo.bar')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_IMPLICIT_OVERLOAD,
                message: 'getaddrinfo ENOTFOUND foo.bar'
            }
        )
    })
    it('timeout, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            }),
            timeout: new UInt(1000)
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').timeout()
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_IMPLICIT_OVERLOAD,
                message: 'timeout of 1000ms exceeded'
            }
        )
    })
    it('other network issues, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            }),
            timeout: new UInt(1000)
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').networkError()
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_SERVER,
                message: 'Network Error'
            }
        )
    })
    it('respond 1xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(100, 'foo.bar')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_RESPONSE,
                message: 'server responds invalid status: 100'
            }
        )
    })
    it('respond 4xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(400, 'bad request')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_REQUEST,
                message: 'server responds bad client request'
            }
        )
    })
    it('respond 5xx status, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(500, 'foo.bar')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_SERVER,
                message: 'server responds internal error'
            }
        )
    })
    it('respond invalid JSON format from body, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '{invalid: json_format}')
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_BAD_RESPONSE,
                message: 'invalid JSON format from HTTP response body'
            }
        )
    })
    it('respond status 429, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(429)
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_EXPLICIT_OVERLOAD,
                message: 'server responds explicit overload'
            }
        )
    })
    it('respond status 503, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(503)
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_EXPLICIT_OVERLOAD,
                message: 'server responds explicit overload'
            }
        )
    })
})
