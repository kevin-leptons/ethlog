'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result} = require('minitype')
const {heximalToFixedBuffer} = require('../../lib/type')

describe('type.heximalToFixedBuffer', () => {
    it('return correct value', () => {
        let heximal = '0x0f0f'
        let size = 2
        let data = Buffer.from('0f0f', 'hex')
        let expectedResult = Result.ok(data)
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is undefined, return error', () => {
        let heximal = undefined
        let size = 2
        let expectedResult = Result.typeError('expect Heximal')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is null, return error', () => {
        let heximal = null
        let size = 2
        let expectedResult = Result.typeError('expect Heximal')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal has no prefix Ox, return error', () => {
        let heximal = '0f0f'
        let size = 2
        let expectedResult = Result.typeError('expect Heximal')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal has invalid digits, return error', () => {
        let heximal = '0x0fX'
        let size = 2
        let expectedResult = Result.typeError('expect Heximal')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is too short, return error', () => {
        let heximal = '0x0f'
        let size = 2
        let expectedResult = Result.typeError('expect a heximal 2 bytes')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('heximal is too long, return error', () => {
        let heximal = '0x0f0f0f'
        let size = 2
        let expectedResult = Result.typeError('expect a heximal 2 bytes')
        let actualResult = heximalToFixedBuffer(heximal, size)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
