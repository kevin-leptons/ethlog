'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, HttpUrl} = require('../../lib/type')

describe('type.HttpUrl.fromString', () => {
    it('protocol http, return correct result', () => {
        let input = 'http://foo.bar/jazz?x=1'
        let expectedResult = new HttpUrl(
            new URL(input)
        )
        let actualResult = HttpUrl.fromString(input).open()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('protocol https, return correct result', () => {
        let input = 'https://foo.bar/jazz?x=1'
        let expectedResult = new HttpUrl(
            new URL(input)
        )
        let actualResult = HttpUrl.fromString(input).open()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not a URL, return error', () => {
        let input = 'abcxyz'
        let expectedResult = Result.typeError('expect a URL')
        let actualResult = HttpUrl.fromString(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid protocol, return error', () => {
        let input = 'ssh://foo.bar'
        let expectedResult = Result.typeError('expect protocol http or https')
        let actualResult = HttpUrl.fromString(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('has username and password, return error', () => {
        let input = 'http://zoo:baz@foo.bar'
        let expectedResult = Result.typeError('expect no username or password')
        let actualResult = HttpUrl.fromString(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
