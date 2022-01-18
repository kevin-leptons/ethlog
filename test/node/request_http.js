'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Timespan, DataSize} = require('minitype')
const mockDate = require('mockdate')
const {Node, HttpResponse} = require('../../lib/node')
const {
    Result,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')
const {
    NODE_OVERLOADING,
    NODE_BAD_SERVER
} = require('../../lib/type').ErrorCode

describe('Node._requestHttp', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('IP address that does not listen, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
            'connect ECONNREFUSED 0.0.0.0:80'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('IP address which is unable to touch, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://172.1.2.3'),
                timeout: Timespan.fromSeconds(1).open()
            })
        })
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
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
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
            'getaddrinfo ENOTFOUND foo.bar'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('timeout, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0'),
                timeout: Timespan.fromSeconds(1).open()
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').timeout()
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
            'timeout of 1000ms exceeded'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('other network issues, return error ', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0'),
                timeout: Timespan.fromSeconds(1).open()
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').networkError()
        let expectedResult = Result.badError(
            NODE_BAD_SERVER,
            'Network Error'
        )
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('response no body, return ok', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, undefined)
        let response = new HttpResponse({
            status: 200,
            body: undefined,
            size: DataSize.fromBytes(0).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.ok(response)
        let actualResult = await node._requestHttp({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
