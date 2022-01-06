'use strict'

/* eslint-disable max-len */

const assert = require('assert')
const {Node} = require('../../lib/node')

describe('Node.getTransactionByHash', () => {
    let node
    before(() => {
        node = new Node({
            identity: 1,
            endpoint: 'https://bsc-dataseed.binance.org'
        })
    })
    it('return a transaction', async() => {
        let hash = '0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f'
        let actualResult = await node.getTransactionByHash(hash)
        let expectedResult = {
            blockHash: '0x9b90e97b1dbd7a0534047356adbc298121d44c1c38c7dc1606427bdd0933e1c3',
            blockNumber: 13495100,
            from: '0xe2d3a739effcd3a99387d015e260eefac72ebea1',
            gas: BigInt('0x7fffffffffffffff'),
            gasPrice: BigInt('0x0'),
            hash: '0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f',
            input: '0xf340fa01000000000000000000000000e2d3a739effcd3a99387d015e260eefac72ebea1',
            nonce: 415549,
            to: '0x0000000000000000000000000000000000001000',
            transactionIndex: 368,
            value: '0x3546c50e91ed2f1',
            type: 0,
            v: '0x94',
            r: '0x8d5ea39feb9214ab8cefbd6b67a5e6fa712a76173f75d5cafa05aec8c1b3563c',
            s: '0x43c9b5e8d80b3a89a7d3f0a5afdc8b1a0d01fb6d415f62d8fecedf3320763277'
        }
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})