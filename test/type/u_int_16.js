'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ResultError, ErrorCode, UInt16} = require('../../lib/type')

describe('type.UInt16.constructor', () => {
    it('negative integer number, throws error', () => {
        assert.throws(
            () => new UInt16(-1),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_U_INT,
            }
        )
    })
    it('negative big integer number, throws error', () => {
        assert.throws(
            () => new UInt16(1n),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_U_INT
            }
        )
    })
    it('float number, throws error', () => {
        assert.throws(
            () => new UInt16(1.1),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_U_INT
            }
        )
    })
    it('overflow, throws error', () => {
        assert.throws(
            () => new UInt16(0x10000),
            {
                constructor: ResultError,
                error: ErrorCode.TYPE_U_INT_16_OVERFLOW
            }
        )
    })
})

describe('type.UInt16.fromHeximal', () => {
    it('0x0, return correct value', () => {
        let input = '0x0'
        let data = new UInt16(0x0)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x1, return correct value', () => {
        let input = '0x1'
        let data = new UInt16(0x1)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x01, return correct value', () => {
        let input = '0x01'
        let data = new UInt16(0x01)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x10, return correct value', () => {
        let input = '0x10'
        let data = new UInt16(0x10)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('16 bits all set, return correct value', () => {
        let input = '0x00ffff'
        let data = new UInt16(0xffff)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('undefined, error not heximal', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('null, error not heximal', () => {
        let input = null
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0afb, error not heximal', () => {
        let input = '0afb'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0xafbX, error not heximal', () => {
        let input = '0xafbX'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bit 17th is set, error overflow', () => {
        let input = '0x0010000'
        let expectedResult = Result.error(ErrorCode.TYPE_HEXIMAL_16_BITS_OVERFLOW)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
