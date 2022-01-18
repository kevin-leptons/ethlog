'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Result, UInt64, Timestamp} = require('minitype')
const {
    Block,
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
            number: UInt64.fromHeximal('0x2').open(),
            timestamp: Timestamp.fromHeximal('0x45').open(),
            transactions: [
                ByteData32.fromHeximal('0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af').open()
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
        let expectedResult = Result.error('number: expect a heximal')
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
        let expectedResult = Result.error('timestamp: expect a heximal')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('transactions is not an array, return error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45',
            transactions: '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
        }
        let expectedResult = new Result('transactions: expect an array')
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
        let expectedResult = new Result('transactions: [0]: expect a heximal')
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
