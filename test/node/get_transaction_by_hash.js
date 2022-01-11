'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {Node} = require('../../lib/node')
const {
    ErrorCode,
    Result,
    UInt16,
    UInt64,
    ByteData32,
    Address,
    HttpUrl,
    HttpEndpoint,
    Transaction
} = require('../../lib/type')

describe('Node.getTransactionByHash', () => {
    it('return a transaction', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: {
                hash: '0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f',
                from: '0xe2d3a739effcd3a99387d015e260eefac72ebea1',
                to: '0x0000000000000000000000000000000000001000',
                blockNumber: '0xCDEB3C',
                transactionIndex: '0x170'
            }
        })
        httpMock.onPost('/').reply(200, responseBody)
        let transaction = new Transaction({
            hash: ByteData32.fromHeximal('0x456d75c7a1a397f7cfea511e932aeeccc36e727db56724df7a424beb14877c5f').open(),
            from: Address.fromHeximal('0xe2d3a739effcd3a99387d015e260eefac72ebea1').open(),
            to: Address.fromHeximal('0x0000000000000000000000000000000000001000').open(),
            blockNumber: new UInt64(13495100n),
            transactionIndex: new UInt16(368)
        })
        let expectedResult = Result.ok(transaction)
        let actualResult = await node.getTransactionByHash(transaction.hash)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('not existed transaction, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: null
        })
        httpMock.onPost('/').reply(200, responseBody)
        let hash = ByteData32.fromHeximal('0x77e556ee94fd7f5b40edbd8aea51115033c8fd58f9e51cfc842820fe90c9bb1b').open()
        let expectedResult = Result.error(ErrorCode.ETH_NO_TRANSACTION, 'missing or not mined yet')
        let actualResult = await node.getTransactionByHash(hash)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('bad RPC data, return error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://foo.bar')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: {}
        })
        httpMock.onPost('/').reply(200, responseBody)
        let hash = ByteData32.fromHeximal('0x77e556ee94fd7f5b40edbd8aea51115033c8fd58f9e51cfc842820fe90c9bb1b').open()
        let expectedResult = Result.error(ErrorCode.ETH_BAD_RESPONSE, 'bad transaction')
        let actualResult = await node.getTransactionByHash(hash)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
