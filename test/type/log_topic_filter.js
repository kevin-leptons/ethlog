'use strict'

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */

const assert = require('assert')
const {
    LogTopicFilter,
    ByteData32,
    Result
} = require('../../lib/type')

describe('type.LogTopicFilter.create', () => {
    it('no topics, return empty filter', () => {
        let input = []
        let expectedResult = Result.ok(
            new LogTopicFilter([])
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('flat topics, return correct combination', () => {
        let input = [
            ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
            ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
            ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
            ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
        ]
        let expectedResult = Result.ok(
            new LogTopicFilter(input)
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('nested topics as array, return correct combination', () => {
        let input = [
            [
                ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
                ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open()
            ],
            [
                ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
                ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open()
            ],
            [
                ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
                ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open()
            ],
            [
                ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open(),
                ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
            ]
        ]
        let expectedResult = Result.ok(
            new LogTopicFilter(input)
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 0 as single value, return error', () => {
        let input = [
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(
            new TypeError('[0]: expect ByteData32 or an Array<ByteData32>')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 1 as single value, return error', () => {
        let input = [
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(
            new TypeError('[1]: expect ByteData32 or an Array<ByteData32>')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 2 as single value, return error', () => {
        let input = [
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(
            new TypeError('[2]: expect ByteData32 or an Array<ByteData32>')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 3 as single value, return error', () => {
        let input = [
            [],
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(
            new TypeError('[3]: expect ByteData32 or an Array<ByteData32>')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 0 as an array, return error', () => {
        let input = [
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(
            new TypeError('[0]: [0]: expect ByteData32')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 1 as an array, return error', () => {
        let input = [
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(
            new TypeError('[1]: [0]: expect ByteData32')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 2 as an array, return error', () => {
        let input = [
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(
            new TypeError('[2]: [0]: expect ByteData32')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 3 as an array, return error', () => {
        let input = [
            [],
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(
            new TypeError('[3]: [0]: expect ByteData32')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not an array, return error', () => {
        let input = '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        let expectedResult = Result.error(
            new TypeError('expect an array')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('too many topics, return error', () => {
        let input = [
            [],
            [],
            [],
            [],
            []
        ]
        let expectedResult = Result.error(
            new TypeError('expect 4 items at most')
        )
        let actualResult = LogTopicFilter.create(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
describe('type.LogTopicFilter.toRpcInput', () => {
    it('no topics, return empty array', () => {
        let topics = LogTopicFilter.create().open()
        let expectedResult = []
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('flat topics, return correct result', () => {
        let topics = LogTopicFilter.create([
            ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
            ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
            ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
            ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
        ]).open()
        let expectedResult = [
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768',
            '0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012',
            '0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77',
            '0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'
        ]
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('nested topics, return correct result', () => {
        let topics = LogTopicFilter.create([
            [
                ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
                ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open()
            ],
            [
                ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
                ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open()
            ],
            [
                ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
                ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open()
            ],
            [
                ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open(),
                ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
            ]
        ]).open()
        let expectedResult = [
            [
                '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768',
                '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
            ],
            [
                '0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012',
                '0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'
            ],
            [
                '0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77',
                '0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'
            ],
            [
                '0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618',
                '0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'
            ]
        ]
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
