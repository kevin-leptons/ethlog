'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ErrorCode, UInt} = require('../../lib/type')

describe('type.UInt.fromHeximal', () => {
    it('0x0, return correct value', () => {
        let input = '0x0'
        let data = new UInt(0x0)
        let expectedResult = Result.ok(data)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x1, return correct value', () => {
        let input = '0x1'
        let data = new UInt(0x1)
        let expectedResult = Result.ok(data)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x01, return correct value', () => {
        let input = '0x01'
        let data = new UInt(0x01)
        let expectedResult = Result.ok(data)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x10, return correct value', () => {
        let input = '0x10'
        let data = new UInt(0x10)
        let expectedResult = Result.ok(data)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('53 bits all set, return correct value', () => {
        let input = '0x001FFFFFFFFFFFFF'
        let data = new UInt(0x001FFFFFFFFFFFFF)
        let expectedResult = Result.ok(data)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('undefined, error not heximal', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('null, error not heximal', () => {
        let input = null
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0afb, error not heximal', () => {
        let input = '0afb'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0xafbX, error not heximal', () => {
        let input = '0xafbX'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bit 54th is set, error overflow', () => {
        let input = '0x0020000000000000'
        let expectedResult = Result.error(ErrorCode.OVERFLOW_U_INT)
        let actualResult = UInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
