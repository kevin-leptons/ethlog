# ethlog

* Best effort for retrive logs from ETH-like JSON RPC endpoints.
* Source code at [github.com](https://github.com/kevin-leptons/ethlog).

# Getting Started

```js
'use strict'

const {
    UInt64, LogStream, HttpUrl, EthEndpoint, Address, Client, LogSegment
} = require('ethlog')

/**
 *
 * @param {LogSegment} logSegment
 * @param {Client} client
 */
async function handler(logSegment, client) {
    let {fromBlock, toBlock, logs} = logSegment
    let blocks = toBlock.sub(fromBlock).addNumber(1)
    console.log(
        logs.length, 'logs;',
        blocks.format(), 'blocks;',
        fromBlock.format(), '...', toBlock.format()
    )
}

async function main() {
    let mainEndpoints = [
        EthEndpoint.create({
            url: HttpUrl.fromString('https://bsc-dataseed.binance.org').open()
        }).open(),
    ]
    let backupEndpoints = [
        EthEndpoint.create({
            url: HttpUrl.fromString('https://bsc-dataseed1.ninicoin.io/').open()
        }).open()
    ]
    let client = Client.create({mainEndpoints, backupEndpoints}).open()
    let addresses = [
        Address.fromHeximal('0x3114c0b418c3798339a765d32391440355da9dde').open()
    ]
    let fromBlock = UInt64.fromNumber(10124609).open()
    await LogStream
        .create({handler, client, addresses, fromBlock})
        .open()
        .start()
}

main().catch(console.error)
```
