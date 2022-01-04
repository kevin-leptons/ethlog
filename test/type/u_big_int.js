'use strict'

const assert = require('assert')
const {UBigInt} = require('../../lib/type')

describe('type.UBigInt.constructor successfully', () => {
    let specs = [
        BigInt(0),
        BigInt(1),
        BigInt(9966)
    ]
    for (let spec of specs) {
        it(`${spec}, return an instance`, () => {
            let actualResult = new UBigInt(spec)
            assert.strictEqual(actualResult instanceof UBigInt, true)
            assert.deepStrictEqual(actualResult.value, spec)
        })
    }
})

describe('type.UBigInt.constructor failure', () => {
    let specs = [
        [
            undefined,
            {
                name: 'DataError',
                message: 'not a unsigned BigInt: value'
            }
        ],
        [
            null,
            {
                name: 'DataError',
                message: 'not a unsigned BigInt: value'
            }
        ],
        [
            BigInt(-1),
            {
                name: 'DataError',
                message: 'not a unsigned BigInt: value'
            }
        ],
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, throw error`
        it(description, () => {
            assert.throws(
                () => new UBigInt(spec[0]),
                spec[1]
            )
        })
    }
})

describe('type.UBigInt.fromHeximal successfully', () => {
    let specs = [
        ['0x1', BigInt(1)],
        ['0x01', BigInt(1)],
        ['0x10', BigInt(16)],
        [
            '0x100000000000000000',
            BigInt('0x100000000000000000'),
            '72 bits number'
        ]
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, return ${spec[1]}`
        it(description, () => {
            let actualResult = UBigInt.fromHeximal(spec[0])
            assert.strictEqual(actualResult instanceof UBigInt, true)
            assert.strictEqual(actualResult.value, spec[1])
        })
    }
})

describe('type.UBigInt.fromHeximal failure', () => {
    let specs = [
        [
            undefined,
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        ],
        [
            null,
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        ],
        [
            '0afb',
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        ],
        [
            '0xafbX',
            {
                name: 'DataError',
                message: 'not a heximal: value'
            }
        ]
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, throw error`
        it(description, () => {
            assert.throws(
                () => UBigInt.fromHeximal(spec[0]),
                spec[1]
            )
        })
    }
})
