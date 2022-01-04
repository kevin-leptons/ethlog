'use strict'

const assert = require('assert')
const {
    Block,
    UBigInt,
    Timestamp,
    TransactionHash
} = require('../../lib/type')

describe('type.Block.fromRpcResult', () => {
    it('successfully', () => {
        let rpcResult = {
            number: '0x2',
            timestamp: '0x45',
            transactions: [
                '0xf712befa13df56c5c11799078b793c49fe12177f'
            ]
        }
        let expectedResult = new Block({
            number: UBigInt.fromHeximal('0x2'),
            timestamp: Timestamp.fromHeximal('0x45'),
            transactions: [
                TransactionHash.fromHeximal('0xf712befa13df56c5c11799078b793c49fe12177f')
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
                '0xf712befa13df56c5c11799078b793c49fe12177f'
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
                '0xf712befa13df56c5c11799078b793c49fe12177f'
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
            transactions: '0xf712befa13df56c5c11799078b793c49fe12177f'
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
