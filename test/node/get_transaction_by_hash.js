'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {ProtocolError, Node} = require('../../lib/node')
const {
    UInt,
    UInt16,
    BigUInt,
    TransactionHash,
    Address,
    HttpUrl,
    HttpEndpoint,
    Transaction
} = require('../../lib/type')

describe('Node.getTransactionByHash', () => {
    let node
    before(() => {
        node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return a transaction', async() => {
        let hash = TransactionHash.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f')
        let actualResult = await node.getTransactionByHash(hash)
        let expectedResult = new Transaction({
            hash: TransactionHash.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f'),
            from: Address.fromHeximal('0xe2d3a739effcd3a99387d015e260eefac72ebea1'),
            to: Address.fromHeximal('0x0000000000000000000000000000000000001000'),
            blockNumber: new BigUInt(13495100),
            transactionIndex: new UInt16(368)
        })
        assert.strictEqual(actualResult instanceof Transaction, true)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not existed transaction, throws error', async() => {
        let randomHash = TransactionHash.fromHeximal('0x77e556ee94fd7f5b40edbd8aea51115033c8fd58f9e51cfc842820fe90c9bb1b')
        await assert.rejects(
            async() => await node.getTransactionByHash(randomHash),
            {
                name: 'NotExistedError',
                kind: 'transaction hash',
                identity: '0x77e556ee94fd7f5b40edbd8aea51115033c8fd58f9e51cfc842820fe90c9bb1b'
            }
        )
    })
    it('bad RPC data, throws error', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: {}
        })
        httpMock.onPost('/').reply(200, responseBody)
        let hash = TransactionHash.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f')
        await assert.rejects(
            () => node.getTransactionByHash(hash),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_RPC_BAD_RESPONSE,
                message: 'eth_getTransactionByHash returns bad data'
            }
        )
    })
})
