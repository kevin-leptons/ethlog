'use strict'

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */

const assert = require('assert')
const {LogTopic, LogTopicCombination} = require('../../lib/type')

describe('type.LogTopicCombination.constructor', () => {
    it('undefined, return empty combination', () => {
        let input = undefined
        let actualResult = new LogTopicCombination(input)
        assert.deepStrictEqual(actualResult.value, [])
    })
    it('no topics, return empty combination', () => {
        let input = []
        let actualResult = new LogTopicCombination(input)
        assert.deepStrictEqual(actualResult.value, [])
    })
    it('flat topics, return correct combination', () => {
        let input = [
            LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
            LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
            LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
            LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
        ]
        let actualResult = new LogTopicCombination(input)
        assert.deepStrictEqual(actualResult.value, [
            LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
            LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
            LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
            LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
        ])
    })
    it('nested topics as array, return correct combination', () => {
        let input = [
            [
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768')
            ],
            [
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012')
            ],
            [
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77')
            ],
            [
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'),
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
            ]
        ]
        let actualResult = new LogTopicCombination(input)
        assert.deepStrictEqual(actualResult.value, [
            [
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768')
            ],
            [
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012')
            ],
            [
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77')
            ],
            [
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'),
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
            ]
        ])
    })
    it('invalid topic 0 as single value, throws error', () => {
        let input = [
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[0]'
            }
        )
    })
    it('invalid topic 1 as single value, throws error', () => {
        let input = [
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[1]'
            }
        )
    })
    it('invalid topic 2 as single value, throws error', () => {
        let input = [
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[2]'
            }
        )
    })
    it('invalid topic 3 as single value, throws error', () => {
        let input = [
            [],
            [],
            [],
            '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[3]'
            }
        )
    })
    it('invalid topic 0 as an array, throws error', () => {
        let input = [
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[0]'
            }
        )
    })
    it('invalid topic 1 as an array, throws error', () => {
        let input = [
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[1]'
            }
        )
    })
    it('invalid topic 2 as an array, throws error', () => {
        let input = [
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[2]'
            }
        )
    })
    it('invalid topic 3 as an array, throws error', () => {
        let input = [
            [],
            [],
            [],
            ['0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768']
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not a topic or array of topics: value[3]'
            }
        )
    })
    it('not an array, throws error', () => {
        let input = '0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'not an array: value'
            }
        )
    })
    it('too many topics, throws error', () => {
        let input = [
            [],
            [],
            [],
            [],
            []
        ]
        assert.throws(
            () => new LogTopicCombination(input),
            {
                name: 'DataError',
                message: 'too many items, maximum is 4: value'
            }
        )
    })
})
describe('type.LogTopicCombination.toRpcInput', () => {
    it('no topics, return empty array', () => {
        let topics = new LogTopicCombination()
        let actualResult = topics.toRpcInput()
        assert.deepStrictEqual(actualResult, [])
    })
    it('flat topics, return correct result', () => {
        let topics = new LogTopicCombination([
            LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
            LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
            LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
            LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
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
        let topics = new LogTopicCombination([
            [
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768'),
                LogTopic.fromHeximal('0xb0bbb0213c85d84ff38a4a76188369ba5356b3392b6c28730a578e6d254d9768')
            ],
            [
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012'),
                LogTopic.fromHeximal('0xc3ae1f9b0610d056dc8d9ef4364868ea1a704a4f453c5901a8b6cd62767be012')
            ],
            [
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77'),
                LogTopic.fromHeximal('0xbf3cf4a93253762cec15e2b2898df402924befba04988104b113583646dc0d77')
            ],
            [
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618'),
                LogTopic.fromHeximal('0x754674f90a27db9ac0452907a2274b087c605ece44f2e668d262f895ebe46618')
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
