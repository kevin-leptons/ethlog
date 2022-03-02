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

describe('Contract.create', () => {
    it('invalid address, return error', () => {
        let address = '0x123def'
        let codec = Codec.create([
            {
                inputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            }
        ]).open()
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://foo.bar').open()
                }).open()
            ]
        }).open()
        let expectedResult = Result.typeError('address: expect Address')
        let actualResult = Contract.create(address, codec, client)
        assert.deepStrictEqual(expectedResult, actualResult)
    })
    it('invalid coded, return error', () => {
        let address = Address.fromHeximal('0x99a830e4e2a09cb0d867202e6847f6914001ac05').open()
        let codec = {}
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://foo.bar').open()
                }).open()
            ]
        }).open()
        let expectedResult = Result.typeError('codec: expect Codec')
        let actualResult = Contract.create(address, codec, client)
        assert.deepStrictEqual(expectedResult, actualResult)
    })
    it('invalid client, return error', () => {
        let address = Address.fromHeximal('0x99a830e4e2a09cb0d867202e6847f6914001ac05').open()
        let codec = Codec.create([
            {
                inputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            }
        ]).open()
        let client = {}
        let expectedResult = Result.typeError('client: expect Client')
        let actualResult = Contract.create(address, codec, client)
        assert.deepStrictEqual(expectedResult, actualResult)
    })
    it('valid input, return ok', () => {
        let address = Address.fromHeximal('0x99a830e4e2a09cb0d867202e6847f6914001ac05').open()
        let codec = Codec.create([
            {
                inputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            }
        ]).open()
        let client = Client.create({
            mainEndpoints: [
                EthEndpoint.create({
                    url: HttpUrl.fromString('https://foo.bar').open()
                }).open()
            ]
        }).open()
        let instance = new Contract(address, codec, client)
        let expectedResult = Result.ok(instance)
        let actualResult = Contract.create(address, codec, client)
        assert.deepStrictEqual(expectedResult, actualResult)
    })
})
