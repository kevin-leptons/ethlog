'use strict'

/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

const assert = require('assert')
const {Address} = require('../../lib/type')

describe('type.Address.eq', () => {
    it('address1 = address2, return true', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.eq(address2)
        let expectedResult = true
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 > address2, return false', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let actualResult = address1.eq(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 < address2, return false', () => {
        let address1 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.eq(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
})
describe('type.Address.lt', () => {
    it('address1 = address2, return false', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.lt(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 > address2, return false', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let actualResult = address1.lt(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 < address2, return true', () => {
        let address1 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.lt(address2)
        let expectedResult = true
        assert.strictEqual(actualResult, expectedResult)
    })
})
describe('type.Address.gt', () => {
    it('address1 = address2, return false', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.gt(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 > address2, return true', () => {
        let address1 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let address2 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let actualResult = address1.gt(address2)
        let expectedResult = true
        assert.strictEqual(actualResult, expectedResult)
    })
    it('address1 < address2, return false', () => {
        let address1 = Address.fromHeximal('0x3b10da8898baaabfb43386705a6a2fe9ea0e0f5c').open()
        let address2 = Address.fromHeximal('0xa30eef141907c240770304bb56118b5895a5c178').open()
        let actualResult = address1.gt(address2)
        let expectedResult = false
        assert.strictEqual(actualResult, expectedResult)
    })
})
