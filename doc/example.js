'use strict'

const {
    LogStream, UInt64, HttpUrl, Endpoint, Address, Log, Client,
    Metadata, LogLevel
} = require('ethlog')

/**
 *
 * @param {Array<Log>} logs
 * @param {Metadata} metadata
 * @param {Client} client
 */
async function handler(logs, metadata, client) {
    let {confirmedBlockNumber} = metadata
    console.log(logs.length, 'logs at', confirmedBlockNumber.value)
}

async function main() {
    let mainEndpoints = [
        new Endpoint({
            url: new HttpUrl('https://bsc-dataseed.binance.orgx')
        }),
    ]
    let backupEndpoints = [
        new Endpoint({
            url: new HttpUrl('https://bsc-dataseed1.ninicoin.io/')
        })
    ]
    let addresses = [
        Address.fromHeximal('0x804678fa97d91b974ec2af3c843270886528a9e6').open()
    ]
    let fromBlock = new UInt64(10111222n)
    let stream = new LogStream({
        handler, mainEndpoints, backupEndpoints, addresses, fromBlock, logLevel: LogLevel.ERROR
    })
    await stream.start()
}

main().catch(console.error)
