'use strict'

const assert = require('assert')
const {NodeError, Node} = require('../../lib/node')
const {
    UInt,
    SafeHttpUrl,
    HttpEndpoint
} = require('../../lib/type')

describe('Node._requestHttp', () => {
    it('IP address that serves nothing, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://0.0.0.0')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'connect ECONNREFUSED 0.0.0.0:80'
            }
        )
    })
    it('IP address which is unable to touch, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('http://172.0.0.0:0')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'timeout of 1000ms exceeded'
            }
        )
    })
    it('domain which is not existed, throws error ', async() => {
        let node = new Node({
            identity: new UInt(1),
            endpoint: new HttpEndpoint({
                url: new SafeHttpUrl('https://foo.bar')
            })
        })
        await assert.rejects(
            () => node._requestHttp({}),
            {
                name: 'NodeError',
                code: NodeError.CODE_NET_BAD_PEER,
                message: 'getaddrinfo ENOTFOUND foo.bar'
            }
        )
    })
})
