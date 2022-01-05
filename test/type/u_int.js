'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {UInt} = require('../../lib/type')

describe('type.UInt.constructor successfully', () => {
    let specs = [
        [0],
        [1],
        [Number.MAX_SAFE_INTEGER, 'maximum 53 bits integer number']
    ]
    for (let spec of specs) {
        let description = spec[1] || `${spec[0]}, return an instance`
        it(description, () => {
            let actualResult = new UInt(spec[0])
            assert.strictEqual(actualResult instanceof UInt, true)
            assert.deepStrictEqual(actualResult.value, spec[0])
        })
    }
})
describe('type.UInt.constructor failure', () => {
    let specs = [
        [
            undefined,
            {
                name: 'DataError',
                message: 'not a unsigned integer number: value'
            }
        ],
        [
            null,
            {
                name: 'DataError',
                message: 'not a unsigned integer number: value'
            }
        ],
        [
            -1,
            {
                name: 'DataError',
                message: 'not a unsigned integer number: value'
            }
        ],
        [
            Number.MAX_SAFE_INTEGER + 1,
            {
                name: 'DataError',
                message: 'overflow 53 bits unsigned integer number: value'
            },
            'overflow 53 bits integer number'
        ]
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, throw error`
        it(description, () => {
            assert.throws(
                () => new UInt(spec[0]),
                spec[1]
            )
        })
    }
})
describe('type.UInt.fromHeximal successfully', () => {
    let specs = [
        ['0x0', 0],
        ['0x1', 1],
        ['0x01', 1],
        ['0x10', 16],
        [
            '0xfffffffffffff',
            2 ** 52 - 1,
            'maximum 52 bits heximal'
        ]
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, return ${spec[1]}`
        it(description, () => {
            let actualResult = UInt.fromHeximal(spec[0])
            assert.strictEqual(actualResult instanceof UInt, true)
            assert.strictEqual(actualResult.value, spec[1])
        })
    }
})
describe('type.UInt.fromHeximal failure', () => {
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
            },
            'heximal has no prefix `0x`'
        ],
        [
            '0xafbX',
            {
                name: 'DataError',
                message: 'not a heximal: value'
            },
            'has invalid heximal digits'
        ],
        [
            '0xffffffffffffffff',
            {
                name: 'DataError',
                message: 'overflow 53 bits integer number: value'
            },
            'overflow 53 bits integer number'
        ]
    ]
    for (let spec of specs) {
        let description = spec[2] || `${spec[0]}, throw error`
        it(description, () => {
            assert.throws(
                () => UInt.fromHeximal(spec[0]),
                spec[1]
            )
        })
    }
})
