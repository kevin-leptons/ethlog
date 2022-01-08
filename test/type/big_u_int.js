'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ErrorCode, BigUInt} = require('../../lib/type')

describe('type.BigUInt.fromHeximal', () => {
    it('0x0, return correct value', () => {
        let input = '0x0'
        let data = new BigUInt(0x0n)
        let expectedResult = Result.ok(data)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x1, return correct value', () => {
        let input = '0x1'
        let data = new BigUInt(0x1n)
        let expectedResult = Result.ok(data)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x01, return correct value', () => {
        let input = '0x01'
        let data = new BigUInt(0x1n)
        let expectedResult = Result.ok(data)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0x10, return correct value', () => {
        let input = '0x10'
        let data = new BigUInt(0x10n)
        let expectedResult = Result.ok(data)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('128 bits all set, return correct value', () => {
        let input = '0x00ffffffffffffffffffffffffffffffff'
        let data = new BigUInt(0x00ffffffffffffffffffffffffffffffffn)
        let expectedResult = Result.ok(data)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('undefined, error not heximal', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('null, error not heximal', () => {
        let input = null
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0afb, error not heximal', () => {
        let input = '0afb'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('0xafbX, error not heximal', () => {
        let input = '0xafbX'
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = BigUInt.fromHeximal(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
