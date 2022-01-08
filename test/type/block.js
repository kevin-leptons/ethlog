'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {
    ErrorCode,
    Result,
    Block,
    BigUInt,
    Timestamp,
    ByteData32
} = require('../../lib/type')

describe('type.Block.fromRpcResult', () => {
    it('successfully', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45',
            transactions: [
                '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
            ]
        }
        let block = new Block({
            number: BigUInt.fromHeximal('0x2').data,
            timestamp: Timestamp.fromHeximal('0x45').data,
            transactions: [
                ByteData32.fromHeximal('0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af').data
            ]
        })
        let expectedResult = Result.ok(block)
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid number, return error', () => {
        let rpcResult = {
            number: '0x2XXX',
            timestamp: '0x45',
            transactions: [
                '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
            ]
        }
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL, 'values.number')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid timestamp, return error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45XXX',
            transactions: [
                '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
            ]
        }
        let expectedResult = Result.error(ErrorCode.NOT_HEXIMAL, 'values.timestamp')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('transactions is not an array, return error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45',
            transactions: '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
        }
        let expectedResult = new Result(ErrorCode.NOT_ARRAY, undefined, 'values.transactions')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid transactions[0], return error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45',
            transactions: [
                '0xf712befa13df56c5c11799078b793c49fe121XXX'
            ]
        }
        let expectedResult = new Result(ErrorCode.NOT_HEXIMAL, undefined, 'values.transactions[0]')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
