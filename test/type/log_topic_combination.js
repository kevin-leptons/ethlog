'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result} = require('minitype')
const {LogTopicCombination, ByteData32} = require('../../lib/type')

describe('type.LogTopicCombination.create', () => {
    it('not an array, return error', () => {
        let input = undefined
        let expectedResult = Result.typeError('expect an array')
        let actualResult = LogTopicCombination.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('an item is not a ByteData32, return error', () => {
        let input = [
            ByteData32.fromHeximal('0x7dd6b82eed0b2bf90c38681296a08c95fa43ed17a18bd8a4e17e80e16b5a8ad1').open(),
            '0xffff'
        ]
        let expectedResult = Result.typeError('[1]: expect ByteData32')
        let actualResult = LogTopicCombination.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('all items is valid, return correct result', () => {
        let input = [
            ByteData32.fromHeximal('0x7dd6b82eed0b2bf90c38681296a08c95fa43ed17a18bd8a4e17e80e16b5a8ad1').open(),
            ByteData32.fromHeximal('0x1bcc7a6bb4f38c659c1b1620770d4fcf2dfd354f935b38d7bfecf7abcc6d1a71').open()
        ]
        let expectedData = new LogTopicCombination([
            ByteData32.fromHeximal('0x7dd6b82eed0b2bf90c38681296a08c95fa43ed17a18bd8a4e17e80e16b5a8ad1').open(),
            ByteData32.fromHeximal('0x1bcc7a6bb4f38c659c1b1620770d4fcf2dfd354f935b38d7bfecf7abcc6d1a71').open()
        ])
        let expectedResult = Result.ok(expectedData)
        let actualResult = LogTopicCombination.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
describe('type.LogTopicCombination.fromHeximals', () => {
    it('not an array, return error', () => {
        let input = undefined
        let expectedResult = Result.typeError('expect an array')
        let actualResult = LogTopicCombination.fromHeximals(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('an item is not a heximal, return error', () => {
        let input = [
            '0x1fb709da01417bfb547bdf65b90d25549fd26c9abaa4d6c0a9249b8d579a3286',
            '0xZZZ'
        ]
        let expectedResult = Result.typeError('[1]: expect a heximal')
        let actualResult = LogTopicCombination.fromHeximals(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('an item is too short heximal, return error', () => {
        let input = [
            '0x1fb709da01417bfb547bdf65b90d25549fd26c9abaa4d6c0a9249b8d579a3286',
            '0x13f'
        ]
        let expectedResult = Result.typeError('[1]: expect a heximal 32 bytes')
        let actualResult = LogTopicCombination.fromHeximals(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('an item is too long heximal, return error', () => {
        let input = [
            '0x1fb709da01417bfb547bdf65b90d25549fd26c9abaa4d6c0a9249b8d579a3286',
            '0x723b4e670a7073ad9ef12b5a5138eb1487d6eadfbd6c338e7533533db68bd530ff'
        ]
        let expectedResult = Result.typeError('[1]: expect a heximal 32 bytes')
        let actualResult = LogTopicCombination.fromHeximals(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('all items is valid, return correct result', () => {
        let input = [
            '0x11268986c163d9a1c2fc8ef489297ac1a8cdb6b517e3c94c5f26b0173a729123',
            '0x6d1326d42017d2859c8bacf010cd72781a01dd3722006820ab9bf997592d50f9'
        ]
        let expectedData = LogTopicCombination.create([
            ByteData32.fromHeximal('0x11268986c163d9a1c2fc8ef489297ac1a8cdb6b517e3c94c5f26b0173a729123').open(),
            ByteData32.fromHeximal('0x6d1326d42017d2859c8bacf010cd72781a01dd3722006820ab9bf997592d50f9').open()
        ]).open()
        let expectedResult = Result.ok(expectedData)
        let actualResult = LogTopicCombination.fromHeximals(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
