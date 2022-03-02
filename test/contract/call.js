'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Contract} = require('../../lib/contract')
const {Client} = require('../../lib/client')
const {Codec} = require('../../lib/codec')
const {
    Result, EthEndpoint, HttpUrl, Address
} = require('../../lib/type')
const {getDataFilePath} = require('../_lib')

describe('Contract.call', () => {
    it('invalid input method, return error', async() => {
        let address = Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
        let abiFilePath = getDataFilePath('abi_bep_20_token.json')
        let codec = Codec.fromJsonFile(abiFilePath).open()
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
                }).open()
            ]
        }).open()
        let contract = Contract.create(address, codec, client).open()
        let expectedResult = Result.ok([18])
        let actualResult = await contract.call('decimals')
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
