'use strict'

const {
    LogStream, UInt64, HttpUrl, EthEndpoint, Address, Log, Client,
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
        new EthEndpoint({
            url: new HttpUrl('https://bsc-dataseed.binance.org')
        }),
    ]
    let backupEndpoints = [
        // new EthEndpoint({
        //     url: new HttpUrl('https://bsc-dataseed1.ninicoin.io/')
        // })
    ]
    let addresses = [
        Address.fromHeximal('0x3114c0b418c3798339a765d32391440355da9dde').open()
    ]
    let fromBlock = new UInt64(10111222n)
    let stream = new LogStream({
        handler, mainEndpoints, backupEndpoints, addresses, fromBlock, logLevel: LogLevel.ERROR
    })
    await stream.start()
}

main().catch(console.error)
