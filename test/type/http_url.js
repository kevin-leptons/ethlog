'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {ResultError, ErrorCode, HttpUrl} = require('../../lib/type')

describe('type.HttpUrl.constructor', () => {
    it('protocol http, return correct result', () => {
        let actualResult = new HttpUrl('http://foo.bar/jazz?x=1')
        let expectedValue = new URL('http://foo.bar/jazz?x=1')
        assert.deepStrictEqual(actualResult.value, expectedValue)
    })
    it('protocol https, return correct result', () => {
        let actualResult = new HttpUrl('https://foo.bar/jazz?x=1')
        let expectedValue = new URL('https://foo.bar/jazz?x=1')
        assert.deepStrictEqual(actualResult.value, expectedValue)
    })
    it('not a URL, throws error', () => {
        assert.throws(
            () => new HttpUrl('abcxyz'),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_URL_STRING
            }
        )
    })
    it('invalid protocol, throws error', () => {
        assert.throws(
            () => new HttpUrl('ssh://foo.bar'),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_PROTOCOL_HTTP,
                hint: 'expected: http or https'
            }
        )
    })
    it('has username and password, throws error', () => {
        assert.throws(
            () => new HttpUrl('http://zoo:baz@foo.bar'),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_URL_NO_AUTHENTICATION,
                hint: 'expected: no username or password'
            }
        )
    })
})
