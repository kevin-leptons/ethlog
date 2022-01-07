'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {
    Block,
    BigUInt,
    Timestamp,
    TransactionHash
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
        let expectedResult = new Block({
            number: BigUInt.fromHeximal('0x2'),
            timestamp: Timestamp.fromHeximal('0x45'),
            transactions: [
                TransactionHash.fromHeximal('0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af')
            ]
        })
        let actualResult = Block.fromRpcResult(rpcResult)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('invalid number, throws error', () => {
        let rpcResult = {
            number: '0x2X',
            timestamp: '0x45',
            transactions: [
                '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
            ]
        }
        assert.throws(
            () => Block.fromRpcResult(rpcResult),
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        )
    })
    it('invalid timestamp, throws error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45Y',
            transactions: [
                '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
            ]
        }
        assert.throws(
            () => Block.fromRpcResult(rpcResult),
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        )
    })
    it('transactions is not an array, throws error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45Y',
            transactions: '0xe085e95d71717c8a054ac838bc7fdb6c64607adc7b9f8dfaee12d3cd8e8e03af'
        }
        assert.throws(
            () => Block.fromRpcResult(rpcResult),
            {
                name: 'DataError',
                message: 'not an array: value.transactions'
            }
        )
    })
    it('invalid transactions[0], throws error', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45Y',
            transactions: [
                '0xf712befa13df56c5c11799078b793c49fe121XXX'
            ]
        }
        assert.throws(
            () => Block.fromRpcResult(rpcResult),
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        )
    })
})
