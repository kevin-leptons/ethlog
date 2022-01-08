'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ErrorCode, UInt16} = require('../../lib/type')

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
        let data = new UInt16(0x00ffff)
        let expectedResult = Result.ok(data)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('undefined, error not heximal', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('null, error not heximal', () => {
        let input = null
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0afb, error not heximal', () => {
        let input = '0afb'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0xafbX, error not heximal', () => {
        let input = '0xafbX'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bit 17th is set, error overflow', () => {
        let input = '0x0010000'
        let expectedResult = Result.error(ErrorCode.OVERFLOW_U_INT_16)
        let actualResult = UInt16.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
