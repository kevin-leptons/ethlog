'use strict'

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */

const assert = require('assert')
const {
    LogTopicFilter,
    ByteData32,
    Result,
    ErrorCode
} = require('../../lib/type')

describe('type.LogTopicFilter.fromArray', () => {
    it('undefined, return error', () => {
        let input = undefined
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY, 'value')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('no topics, return empty filter', () => {
        let input = []
        let data = new LogTopicFilter()
        let expectedResult = Result.ok(data)
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('flat topics, return correct combination', () => {
        let input = [
            ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
            ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
            ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
            ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
        ]
        let data = new LogTopicFilter(input)
        let expectedResult = Result.ok(data)
        let actualResult = LogTopicFilter.fromArray(input)
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
        let data = new LogTopicFilter(input)
        let expectedResult = Result.ok(data)
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 0 as single value, return error', () => {
        let input = [
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[0]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 1 as single value, return error', () => {
        let input = [
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[1]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 2 as single value, return error', () => {
        let input = [
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[2]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 3 as single value, return error', () => {
        let input = [
            [],
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[3]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 0 as an array, return error', () => {
        let input = [
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[0]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 1 as an array, return error', () => {
        let input = [
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[1]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 2 as an array, return error', () => {
        let input = [
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[2]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid topic 3 as an array, return error', () => {
        let input = [
            [],
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        let expectedResult = Result.error(ErrorCode.NOT_ARRAY_OR_BYTE_DATA_32, 'value[3]')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not an array, return error', () => {
        let input = '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        let expectedResult = new Result(ErrorCode.NOT_ARRAY, undefined, 'value')
        let actualResult = LogTopicFilter.fromArray(input)
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
        let expectedResult = Result.error(ErrorCode.NOT_ACCEPTED_SIZE, 'value')
        let actualResult = LogTopicFilter.fromArray(input)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
describe('type.LogTopicFilter.toRpcInput', () => {
    it('no topics, return empty array', () => {
        let topics = new LogTopicFilter()
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, [])
    })
    it('flat topics, return correct result', () => {
        let topics = new LogTopicFilter([
            ByteData32.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768').open(),
            ByteData32.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012').open(),
            ByteData32.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77').open(),
            ByteData32.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618').open()
        ])
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, [
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768',
            '0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012',
            '0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77',
            '0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'
        ])
    })
    it('nested topics, return correct result', () => {
        let topics = new LogTopicFilter([
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
        ])
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, [
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
        ])
    })
})
