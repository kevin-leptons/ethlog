'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, ErrorCode, heximalToFixedBuffer} = require('../../lib/type')

describe('type.heximalToFixedBuffer', () => {
    it('return correct value', () => {
        let heximal = '0x0f0f'
        let size = 2
        let data = Buffer.from('0f0f', 'hex')
        let expectedResult = Result.ok(data)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('size is not a number, return error', () => {
        let heximal = '0x0f0f'
        let size = '2'
        let expectedResult = Result.error(ErrorCode.NOT_U_INT)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is undefined, return error', () => {
        let heximal = undefined
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is null, return error', () => {
        let heximal = null
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal has no prefix Ox, return error', () => {
        let heximal = '0f0f'
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal has invalid digits, return error', () => {
        let heximal = '0x0fX'
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is too short, return error', () => {
        let heximal = '0x0f'
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_ACCEPTED_SIZE)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is too long, return error', () => {
        let heximal = '0x0f0f0f'
        let size = 2
        let expectedResult = Result.error(ErrorCode.NOT_ACCEPTED_SIZE)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
