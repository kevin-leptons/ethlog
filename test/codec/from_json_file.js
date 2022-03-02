'use strict'

/* eslint-disable max-lines-per-function */

const assert = require('assert')
const mockFs = require('mock-fs')
const {Result} = require('../../lib/type')
const {Codec} = require('../../lib/codec')
const {readDataFile} = require('../_lib')

describe('type.Codec.fromJsonFile', () => {
    afterEach(() => {
        mockFs.restore()
    })
    it('not existed file, return error', () => {
        let filePath = 'not_existed_file'
        let actualResult = Codec.fromJsonFile(filePath)
        assert.strictEqual(actualResult instanceof Result, true)
        assert.strictEqual(actualResult.error.code, 'ENOENT')
    })
    it('file data is invalid JSON format, return error', () => {
        let filePath = 'abi_01.json'
        mockFs({
            [filePath]: mockFs.file({
                content: readDataFile(filePath)
            })
        })
        let expectedResult = Result.typeError(
            'file abi_01.json: expect JSON format'
        )
        let actualResult = Codec.fromJsonFile(filePath)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('file data is not an array, return error', () => {
        let filePath = 'abi_02.json'
        mockFs({
            [filePath]: mockFs.file({
                content: readDataFile(filePath)
            })
        })
        let expectedResult = Result.typeError(
            'file abi_02.json: expect Array'
        )
        let actualResult = Codec.fromJsonFile(filePath)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
    it('file data is valid, return ok', () => {
        let filePath = 'abi_03.json'
        mockFs({
            [filePath]: mockFs.file({
                content: readDataFile(filePath)
            })
        })
        let instance = new Codec([
            {
                inputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor'
            }
        ])
        let expectedResult = Result.ok(instance)
        let actualResult = Codec.fromJsonFile(filePath)
        assert.deepStrictEqual(actualResult, expectedResult)
    })
})
