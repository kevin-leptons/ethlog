'use strict'

/* eslint-disable max-len */
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
    NODE_BAD_SERVER,
    NODE_BAD_REQUEST,
    NODE_BAD_RESPONSE
} = require('../../lib/type').ErrorCode

describe('Node._requestHttpJson', () => {
    before(() => {
        mockDate.set(0)
    })
    after(() => {
        mockDate.reset()
    })
    it('respond 1xx status, return error NODE_BAD_RESPONSE', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(100, 'message from server')
        let httpResponse = new HttpResponse({
            status: 100,
            body: 'message from server',
            size: DataSize.fromBytes(19).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_RESPONSE,
            'http status 100',
            httpResponse
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond 4xx status, return error NODE_BAD_REQUEST', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(400, 'message from server')
        let response = new HttpResponse({
            status: 400,
            body: 'message from server',
            size: DataSize.fromBytes(19).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_REQUEST,
            'http status 400',
            response
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond 5xx status, return error NODE_BAD_SERVER', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(500, 'message from server')
        let response = new HttpResponse({
            status: 500,
            body: 'message from server',
            size: DataSize.fromBytes(19).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_SERVER,
            'http status 500',
            response
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond status 429, return error NODE_OVERLOADING', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(429, 'message from server')
        let response = new HttpResponse({
            status: 429,
            body: 'message from server',
            size: DataSize.fromBytes(19).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
            'http status 429',
            response
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond status 503, return error NODE_OVERLOADING', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(503, 'message from server')
        let response = new HttpResponse({
            status: 503,
            body: 'message from server',
            size: DataSize.fromBytes(19).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_OVERLOADING,
            'http status 503',
            response
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('respond invalid JSON format, return error ETH_BAD_RESPONSE', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        httpMock.onPost('/').reply(200, '{invalid: json_format}')
        let response = new HttpResponse({
            status: 200,
            body: '{invalid: json_format}',
            size: DataSize.fromBytes(22).open(),
            time: Timespan.fromMiliseconds(0).open()
        })
        let expectedResult = Result.badError(
            NODE_BAD_RESPONSE,
            'expect valid JSON format',
            response
        )
        let actualResult = await node._requestHttpJson({})
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
'{invalid: json_format}'
