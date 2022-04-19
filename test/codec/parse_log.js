'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {
    Log, Address, UInt16, UInt64, LogTopicCombination, ByteData,
    ByteData32
} = require('../../lib/type')
const {Codec} = require('../../lib/codec')
const {getDataFilePath} = require('../_lib')

describe('type.Codec.parseLog', () => {
    it('not matched main topic, throws error', () => {
        let abiPath = getDataFilePath('abi_bep_20_token.json')
        let codec = Codec.fromJsonFile(abiPath).open()
        let input = Log.create({
            address: Address.fromHeximal('0x6ae882ddb6b4883014c54a4979cb3d24e4c16919').open(),
            blockNumber: UInt64.fromNumber(137).open(),
            logIndex: UInt16.fromNumber(246).open(),
            transactionIndex: UInt16.fromNumber(580).open(),
            topics: LogTopicCombination.fromHeximals([
                '0xe1435061b4ae9c373225a9ad501a851ca4b201f16bd1087ce8d7c722a96f197b'
            ]).open(),
            data: ByteData.fromHeximal('0x8200c8f2da6579ad0ceca434fb9e1af724ffc0078b218362611f6dcc7c8f0e51').open(),
            blockHash: ByteData32.fromHeximal('0x9d82f4cf07fef03861f608ae18a51f37231793e5e4aa25220f30fee505f5cd03').open(),
            transactionHash: ByteData32.fromHeximal('0x7cc343cc4f6a1bfcc857043866997a2d3145373fafedd6c8a7d7ef370dc0d3e9').open()
        }).open()
        assert.throws(
            () => codec.parseLog(input),
            {
                constructor: Error,
                message: 'no matching event (argument="topichash", value="0xe1435061b4ae9c373225a9ad501a851ca4b201f16bd1087ce8d7c722a96f197b", code=INVALID_ARGUMENT, version=abi/5.6.0)'
            }
        )
    })
    it('not matched sub topics, throws error', () => {
        let abiPath = getDataFilePath('abi_bep_20_token.json')
        let codec = Codec.fromJsonFile(abiPath).open()
        let eventTopic = codec.getEventTopic('Transfer').toHeximal()
        let input = Log.create({
            address: Address.fromHeximal('0x6ae882ddb6b4883014c54a4979cb3d24e4c16919').open(),
            blockNumber: UInt64.fromNumber(137).open(),
            logIndex: UInt16.fromNumber(246).open(),
            transactionIndex: UInt16.fromNumber(580).open(),
            topics: LogTopicCombination.fromHeximals([
                eventTopic
            ]).open(),
            data: ByteData.fromHeximal('0x8200c8f2da6579ad0ceca434fb9e1af724ffc0078b218362611f6dcc7c8f0e51').open(),
            blockHash: ByteData32.fromHeximal('0x9d82f4cf07fef03861f608ae18a51f37231793e5e4aa25220f30fee505f5cd03').open(),
            transactionHash: ByteData32.fromHeximal('0x7cc343cc4f6a1bfcc857043866997a2d3145373fafedd6c8a7d7ef370dc0d3e9').open()
        }).open()
        assert.throws(
            () => codec.parseLog(input),
            {
                constructor: Error,
                message: 'data out-of-bounds (length=0, offset=32, code=BUFFER_OVERRUN, version=abi/5.6.0)'
            }
        )
    })
    it('not enough data, throws error', () => {
        let abiPath = getDataFilePath('abi_bep_20_token.json')
        let codec = Codec.fromJsonFile(abiPath).open()
        let eventTopic = codec.getEventTopic('Transfer').toHeximal()
        let input = Log.create({
            address: Address.fromHeximal('0x6ae882ddb6b4883014c54a4979cb3d24e4c16919').open(),
            blockNumber: UInt64.fromNumber(137).open(),
            logIndex: UInt16.fromNumber(246).open(),
            transactionIndex: UInt16.fromNumber(580).open(),
            topics: LogTopicCombination.fromHeximals([
                eventTopic,
                '0x000000000000000000000000326714e350d0b88f5268c9fbdf337076c91c738d',
                '0x000000000000000000000000a6b04e25206989f8ed1ddbaf7ec48ac93ea2fa4a'
            ]).open(),
            data: ByteData.fromHeximal('0x').open(),
            blockHash: ByteData32.fromHeximal('0x9d82f4cf07fef03861f608ae18a51f37231793e5e4aa25220f30fee505f5cd03').open(),
            transactionHash: ByteData32.fromHeximal('0x7cc343cc4f6a1bfcc857043866997a2d3145373fafedd6c8a7d7ef370dc0d3e9').open()
        }).open()
        assert.throws(
            () => codec.parseLog(input),
            {
                constructor: Error,
                message: 'data out-of-bounds (length=0, offset=32, code=BUFFER_OVERRUN, version=abi/5.6.0)'
            }
        )
    })
    it('valid input, return correct result', () => {
        let abiPath = getDataFilePath('abi_bep_20_token.json')
        let codec = Codec.fromJsonFile(abiPath).open()
        let eventTopic = codec.getEventTopic('Transfer').toHeximal()
        let input = Log.create({
            address: Address.fromHeximal('0x6ae882ddb6b4883014c54a4979cb3d24e4c16919').open(),
            blockNumber: UInt64.fromNumber(137).open(),
            logIndex: UInt16.fromNumber(246).open(),
            transactionIndex: UInt16.fromNumber(580).open(),
            topics: LogTopicCombination.fromHeximals([
                eventTopic,
                '0x000000000000000000000000326714e350d0b88f5268c9fbdf337076c91c738d',
                '0x000000000000000000000000a6b04e25206989f8ed1ddbaf7ec48ac93ea2fa4a'
            ]).open(),
            data: ByteData.fromHeximal('0x8200c8f2da6579ad0ceca434fb9e1af724ffc0078b218362611f6dcc7c8f0e51').open(),
            blockHash: ByteData32.fromHeximal('0x9d82f4cf07fef03861f608ae18a51f37231793e5e4aa25220f30fee505f5cd03').open(),
            transactionHash: ByteData32.fromHeximal('0x7cc343cc4f6a1bfcc857043866997a2d3145373fafedd6c8a7d7ef370dc0d3e9').open()
        }).open()
        let actualResult = codec.parseLog(input)
        let {topic, args} = actualResult
        assert.strictEqual(topic, eventTopic)
        assert.strictEqual(args.from, '0x326714e350D0B88f5268C9FBDf337076c91C738d')
        assert.strictEqual(args.to, '0xa6B04e25206989F8ED1DdBAf7Ec48AC93ea2fa4A')
        assert.strictEqual(args.value.toHexString('hex'), '0x8200c8f2da6579ad0ceca434fb9e1af724ffc0078b218362611f6dcc7c8f0e51')
    })
})
