const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const http = require('node:http');
const { once } = require('node:events');
const SendPackage = require('../dist/commands/base/sendPackage').default;
const { parseEndpoint, parsePort } = require('../dist/commons/endpoint');
const { getDeviceAction } = require('../dist/service/ipcRoutes');
const { validateDevice } = require('../dist/commons/validateDevice');
const SocketClient = require('../dist/commons/socketClient').default;
const HttpServer = require('../dist/commons/httpServer').default;

test('hex commands reject truncation and preserve saved command bytes', () => {
    assert.deepEqual([...SendPackage.Create('00 ff 12').getCmd()], [0, 255, 18]);
    assert.deepEqual([...SendPackage.Create(new Uint8Array([0, 255])).getCmd()], [0, 255]);
    for (const invalid of ['', 'f', 'abc', '01zz', null, {}]) {
        assert.throws(() => SendPackage.Create(invalid).getCmd());
    }
});
test('endpoint validation accepts IPv6 and rejects partial or invalid ports', () => {
    assert.deepEqual(parseEndpoint('[::1]:8080'), {host:'::1', port:8080});
    assert.deepEqual(parseEndpoint('localhost:80'), {host:'localhost', port:80});
    for (const value of ['0', '65536', '1x', '-1', '1.2']) assert.throws(() => parsePort(value));
    for (const value of ['localhost', ':80', '::1:80']) assert.throws(() => parseEndpoint(value));
});
test('IPC routes do not expose arbitrary services or inherited methods', () => {
    assert.equal(getDeviceAction('device/loadData'), 'loadData');
    for (const route of ['device/constructor', 'device/__proto__', 'databaseManager/initialize', 'device/min/extra', null]) {
        assert.throws(() => getDeviceAction(route));
    }
});
test('device validation converts native select values to numeric enum', () => {
    const input = {name:' test ', address:' localhost:80 ', deviceType:0, deviceChannelType:'0'};
    assert.equal(validateDevice(input).deviceChannelType, 0);
    assert.equal(validateDevice(input).address, 'localhost:80');
    assert.throws(() => validateDevice({...input, deviceChannelType:99}));
    assert.throws(() => validateDevice({...input, address:'localhost:80000'}));
});
test('TCP receives data, closes, and reconnects without stale close events', async t => {
    const server = net.createServer(socket => socket.on('data', data => socket.end(data)));
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => server.close());
    let resolveClose, resolveData, resolveOpen;
    class Client extends SocketClient {
        onError(error) { throw error; }
        onConnect() { resolveOpen(); }
        onData(data) { resolveData(data); }
        onClose() { resolveClose(); }
    }
    const client = new Client(`127.0.0.1:${server.address().port}`);
    t.after(() => client.dispose());
    for (let i = 0; i < 2; i++) {
        const opened = new Promise(r => resolveOpen = r);
        const received = new Promise(r => resolveData = r);
        const closed = new Promise(r => resolveClose = r);
        client.connect(); client.connect(); await opened;
        client.send(Buffer.from('hello'));
        assert.equal((await received).toString(), 'hello'); await closed;
    }
    client.dispose(); client.dispose();
});
test('HTTP collects chunked UTF-8 bodies once and rejects oversized requests', async t => {
    const received = [];
    let listening;
    class Server extends HttpServer {
        onConnect() { listening(); }
        onData(data) { received.push(data); }
        onError(error) { throw error; }
    }
    const server = new Server(0);
    t.after(() => server.dispose());
    const ready = new Promise(r => listening = r);
    server.connect(); await ready;
    const port = server.httpServer.address().port;
    async function request(chunks) {
        return new Promise((resolve, reject) => {
            const req = http.request({hostname:'127.0.0.1', port, method:'POST'}, res => {
                res.resume(); res.on('end', () => resolve(res.statusCode));
            });
            req.on('error', reject);
            for (const chunk of chunks) req.write(chunk);
            req.end();
        });
    }
    const utf8 = Buffer.from('你好');
    assert.equal(await request([utf8.subarray(0, 2), utf8.subarray(2)]), 200);
    assert.deepEqual(received, ['你好']);
    assert.equal(await request([Buffer.alloc(1024 * 1024 + 1)]), 413);
    assert.equal(received.length, 1);
    server.dispose(); server.dispose();
});
test('UDP sends to configured destination and receives a reply', async t => {
    const dgram = require('node:dgram');
    const { UdpClient } = require('../dist/commons/udpClient');
    const echo = dgram.createSocket('udp4');
    echo.bind(0, '127.0.0.1'); await once(echo, 'listening');
    t.after(() => echo.close());
    echo.on('message', (data, peer) => echo.send(data, peer.port, peer.address));
    const reservation = dgram.createSocket('udp4');
    reservation.bind(0); await once(reservation, 'listening');
    const port = reservation.address().port;
    reservation.close(); await once(reservation, 'close');
    let opened, received;
    class Client extends UdpClient {
        onOpen() { opened(); }
        onData(data) { received(data); }
        onError(error) { throw error; }
    }
    const client = new Client(String(port), {remoteAddress:'127.0.0.1', remotePort:echo.address().port});
    t.after(() => client.dispose());
    const ready = new Promise(r => opened = r);
    const reply = new Promise(r => received = r);
    client.connect(); await ready; client.send(Buffer.from('udp'));
    assert.equal((await reply).toString(), 'udp');
    client.dispose(); client.dispose();
});
