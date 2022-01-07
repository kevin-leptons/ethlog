'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {ProtocolError, Node} = require('../../lib/node')
const {
    UInt,
    BigUInt,
    Timestamp,
    HttpUrl,
    HttpEndpoint,
    TransactionHash,
    Block
} = require('../../lib/type')

describe('Node.getBlockByNumber', () => {
    let node
    before(() => {
        node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return a block', async() => {
        let number = new BigUInt(13458853)
        let block = await node.getBlockByNumber(number)
        assert.strictEqual(block instanceof Block, true)
        assert.deepStrictEqual(block.number, number)
        assert.deepStrictEqual(block.timestamp, new Timestamp(1639457652))
        assert.deepStrictEqual(
            block.transactions[0],
            TransactionHash.fromHeximal('0xabe913f1c2dfe5a759e301d6d27e20766a78fc11a4e0298a6a50c52ff06e95bb')
        )
    })
    it('block is not existed, throws error', async() => {
        let number = BigUInt.fromHeximal('0xffffffffffffff')
        await assert.rejects(
            async() => await node.getBlockByNumber(number),
            {
                name: 'NotExistedError',
                kind: 'block',
                identity: '0xffffffffffffff'
            }
        )
    })
    it('invalid block number, throws error', async() => {
        let number = '123'
        await assert.rejects(
            () => node.getBlockByNumber(number),
            {
                name: 'DataError',
                message: 'not a BigUInt: blockNumber'
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
        let blockNumber = BigUInt.fromHeximal('0x1')
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x'
        })
        httpMock.onPost('/').reply(200, responseBody)
        await assert.rejects(
            () => node.getBlockByNumber(blockNumber),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_RPC_BAD_RESPONSE,
                message: 'eth_getBlockByNumber returns bad data'
            }
        )
    })
})
