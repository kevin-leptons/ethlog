'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ResultError, ErrorCode, Timestamp} = require('../../lib/type')

describe('type.Timestamp.constructor', () => {
    it('negative integer number, throws error', () => {
        assert.throws(
            () => new Timestamp(-1),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_BIG_U_INT
            }
        )
    })
    it('negative big integer number, throws error', () => {
        assert.throws(
            () => new Timestamp(-1n),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_BIG_U_INT
            }
        )
    })
    it('float number, throws error', () => {
        assert.throws(
            () => new Timestamp(1.1),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_BIG_U_INT
            }
        )
    })
    it('overflow, throws error', () => {
        assert.throws(
            () => new Timestamp(0x10000000000000000n),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_U_INT_64_OVERFLOW
            }
        )
    })
})
describe('type.Timestamp.fromHeximal', () => {
    it('0x0, return correct value', () => {
        let input = '0x0'
        let data = new Timestamp(0x0n)
        let expectedResult = Result.ok(data)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x1, return correct value', () => {
        let input = '0x1'
        let data = new Timestamp(0x1n)
        let expectedResult = Result.ok(data)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x01, return correct value', () => {
        let input = '0x01'
        let data = new Timestamp(0x01n)
        let expectedResult = Result.ok(data)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x10, return correct value', () => {
        let input = '0x10'
        let data = new Timestamp(0x10n)
        let expectedResult = Result.ok(data)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('64 bits all set, return correct value', () => {
        let input = '0xffffffffffffffff'
        let data = new Timestamp(0xffffffffffffffffn)
        let expectedResult = Result.ok(data)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('undefined, error not heximal', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('null, error not heximal', () => {
        let input = null
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0afb, error not heximal', () => {
        let input = '0afb'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0xafbX, error not heximal', () => {
        let input = '0xafbX'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bit 65th is set, error overflow', () => {
        let input = '0x0010000000000000000'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL_64_BITS_OVERFLOW)
        let actualResult = Timestamp.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
