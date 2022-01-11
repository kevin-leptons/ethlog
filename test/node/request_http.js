'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Node} = require('../../lib/node')
const {
    ErrorCode,
    Result,
    Timespan,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestHttp', () => {
    it('IP address that does not listen, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let expectedResult = Result.error(
            ErrorCode.ETH_IMPLICIT_OVERLOADING,
            'connect ECONNREFUSED 0.0.0.0:80'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('IP address which is unable to touch, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://172.1.2.3'),
                timeout: new Timespan(1000)
            })
        })
        let expectedResult = Result.error(
            ErrorCode.ETH_IMPLICIT_OVERLOADING,
            'timeout of 1000ms exceeded'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not existed domain, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://foo.bar')
            })
        })
        let expectedResult = Result.error(
            ErrorCode.ETH_IMPLICIT_OVERLOADING,
            'getaddrinfo ENOTFOUND foo.bar'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('timeout, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0'),
                timeout: new Timespan(1000)
            }),
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').timeout()
        let expectedResult = Result.error(
            ErrorCode.ETH_IMPLICIT_OVERLOADING,
            'timeout of 1000ms exceeded'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('other network issues, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0'),
                timeout: new Timespan(1000)
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').networkError()
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_SERVER,
            'Network Error'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond 1xx status, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(100, 'message from server')
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_RESPONSE,
            'http status: 100'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond 4xx status, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(400, 'message from server')
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_REQUEST,
            'http status: 400'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond 5xx status, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(500, 'message from server')
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_SERVER,
            'http status: 500'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond invalid JSON format from body, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '{invalid: json_format}')
        let expectedResult = Result.error(
            ErrorCode.ETH_BAD_RESPONSE,
            'http body: invalid JSON format'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond status 429, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(429)
        let expectedResult = Result.error(
            ErrorCode.ETH_EXPLICIT_OVERLOADING,
            'http status: 429'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond status 503, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(503)
        let expectedResult = Result.error(
            ErrorCode.ETH_EXPLICIT_OVERLOADING,
            'http status: 503'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
