'use strict'

const {
    isUint,
    isHeximal,
} = require('./validator')
const {
    UBigInt,
    Heximal
} = require('./type')

/**
 * 
 * @param {Heximal} value 
 * @returns {UBigInt | DataError}
 */
function heximalToBigInt(value) {
    if (!isHeximal(value)) {
        return new DataError('not a heximal: value')
    }
    return BigInt(value)
}

/**
 *
 * @param {any} number
 * @param {Heximal} defaultValue
 * @returns {Heximal | undefined}
 */
function numberToHeximal(number, defaultValue=undefined) {
    if (number === undefined) {
        return defaultValue
    }

    if (!Number.isInteger(number) || number < 0) {
        return undefined
    }

    return '0x' + number.toString(16)
}

/**
 *
 * @param {any} heximal
 * @param {number} defaultValue
 * @returns {number}
 */
function heximalToNumber(heximal, defaultValue=undefined) {
    if (heximal === undefined) {
        return defaultValue
    }

    return Number(heximal)
}

/**
 * @param {any} value
 * @returns {Heximal}
 */
function uIntToHeximal(value) {
    if (!isUint(value)) {
        return undefined
    }
    return '0x' + value.toString(16)
}

module.exports = {
    numberToHeximal,
    uIntToHeximal,
    heximalToNumber,
}
