'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const AxiosMock = require('axios-mock-adapter')
const {ProtocolError, Node} = require('../../lib/node')
const {
    BigUInt,
    HttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node.getBlockNumber', () => {
    let node
    before(() => {
        node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('https://bsc-dataseed.binance.org')
            })
        })
    })
    it('return BigUInt', async() => {
        let actualResult = await node.getBlockNumber()
        assert.strictEqual(actualResult instanceof BigUInt, true)
    })
    it('bad RPC data, throws error', async() => {
        let node = new Node({
            endpoint: new HttpEndpoint({
                url: new HttpUrl('http://0.0.0.0')
            })
        })
        let httpMock = new AxiosMock(node._httpClient)
        let responseBody = JSON.stringify({
            result: '0x'
        })
        httpMock.onPost('/').reply(200, responseBody)
        await assert.rejects(
            () => node.getBlockNumber(),
            {
                name: 'ProtocolError',
                code: ProtocolError.CODE_RPC_BAD_RESPONSE,
                message: 'eth_blockNumber returns bad data'
            }
        )
    })
})
