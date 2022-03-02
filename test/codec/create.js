'use strict'

const assert = require('assert')
const {Result} = require('../../lib/type')
const {Codec} = require('../../lib/codec')

describe('type.Codec.create', () => {
    it('abi is no an array, return error', () => {
        let abi = '[]'
        let expectedResult = Result.typeError('abi: expect Array')
        let actualResult = Codec.create(abi)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('from an array, return ok', () => {
        let abi = [
            {
                inputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            }
        ]
        let codec = new Codec(abi)
        let expectedResult = Result.ok(codec)
        let actualResult = Codec.create(abi)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
