const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {createSshServer} = require('./helpers/ssh-server.cjs');
const SshClient = require('../dist/deviceManager/sshDeviceClient').default;
const {inspectSshHost} = require('../dist/deviceManager/sshDeviceClient');
const {validateDevice} = require('../dist/commons/validateDevice');
const {sshEndpoint} = require('../dist/commons/sshOptions');
const {getDeviceAction} = require('../dist/service/ipcRoutes');
const waitFor = async check => {
    const deadline = Date.now() + 5000;
    while (!check()) { if (Date.now() > deadline) throw new Error('Timed out waiting for SSH event'); await new Promise(resolve => setTimeout(resolve, 20)); }
};
async function setup(t, channel = 5, auth = {}) {
    const server = await createSshServer();
    const events = [];
    const client = new SshClient({address: `${channel === 5 ? 'ssh' : 'sftp'}://127.0.0.1:${server.port}`, deviceChannelType: channel, deviceType: 0,
        options: {auth: {username: 'tester', password: 'test-password', hostKey: server.fingerprint, ...auth}}}, message => events.push(message));
    t.after(async () => { client.dispose(); await server.close(); });
    return {client, server, events};
}

test('SSH/SFTP addresses remain distinct, accept IPv6, and saved settings exclude credentials', () => {
    assert.equal(sshEndpoint('example.com', 'ssh').address, 'ssh://example.com:22');
    assert.equal(sshEndpoint('[::1]:2222', 'sftp').host, '::1');
    for (const address of ['ssh://user:password@host', 'ssh://host/path', 'sftp://host', 'host:0', 'host:65536']) assert.throws(() => sshEndpoint(address, 'ssh'));
    for (const channel of [5, 6]) {
        const value = validateDevice({name: 'remote', address: 'localhost:22', deviceType: 0, deviceChannelType: channel,
            option: {username: ' tester ', password: 'must not save', privateKey: 'must not save', passphrase: 'must not save'}});
        assert.deepEqual(value.option, {username: 'tester'});
        assert.equal(value.address, `${channel === 5 ? 'ssh' : 'sftp'}://localhost:22`);
    }
    for (const route of ['device/remoteWrite', 'device/sftpTransfer', 'device/inspectSshHost']) assert.ok(getDeviceAction(route));
    assert.throws(() => getDeviceAction('device/exec'));
});

test('SSH fingerprint probe never authenticates; password terminal handles UTF-8, resize and exit', {timeout: 15000}, async t => {
    const {client, server, events} = await setup(t);
    assert.equal(await inspectSshHost(client.address, 'ssh'), server.fingerprint);
    assert.deepEqual(server.authenticated, []);
    await client.connect();
    assert.equal(client.state, true);
    assert.deepEqual(client.options.options, {});
    await waitFor(() => events.some(event => event.type === 'REMOTE_OUTPUT'));
    client.sendMessage(Buffer.from('echo 你好\r'));
    client.resize(110, 32);
    await waitFor(() => client.snapshot().bytes.toString().includes('你好'));
    await waitFor(() => server.windows.some(window => window.cols === 110 && window.rows === 32));
    client.sendMessage(Buffer.from('exit\r'));
    await waitFor(() => client.state === false);
    assert.throws(() => client.sendMessage(Buffer.from('x')), /未连接/);
});

test('SSH rejects wrong passwords and mismatched host keys', {timeout: 15000}, async t => {
    const {client} = await setup(t, 5, {password: 'wrong'});
    await assert.rejects(client.connect(), /authentication/i);
    assert.equal(client.state, false);
    const other = await setup(t, 5, {hostKey: 'SHA256:' + 'A'.repeat(43)});
    await assert.rejects(other.client.connect(), /verification|指纹/i);
    assert.equal(other.client.state, false);
    assert.deepEqual(other.server.authenticated, []);
});

test('SSH authenticates with a private key and cancels a pending connection cleanly', {timeout: 15000}, async t => {
    const {client, server} = await setup(t);
    client.options.options.auth = {username: 'tester', privateKey: server.encryptedPrivateKey, passphrase: 'key-passphrase', hostKey: server.fingerprint};
    await client.connect();
    assert.equal(client.state, true);
    assert.ok(server.authenticated.includes('publickey'));
    const other = await setup(t);
    const connecting = other.client.connect();
    other.client.dispose();
    await assert.rejects(connecting, /取消/);
    assert.equal(other.client.state, false);
});

test('SFTP lists directories, round-trips binary/Unicode files, renames and removes without overwriting', {timeout: 20000}, async t => {
    const {client, server, events} = await setup(t, 6);
    const local = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-sftp-local-'));
    t.after(() => fs.rm(local, {recursive: true, force: true}));
    await client.connect();
    const payload = Buffer.concat([Buffer.from('中文内容\0'), Buffer.from(Array.from({length: 65536}, (_, index) => index % 256))]);
    await fs.writeFile(path.join(local, 'source.bin'), payload);
    await client.mkdir('/测试目录');
    assert.equal((await client.list('/')).entries[0].directory, true);
    await client.transferFile('upload', path.join(local, 'source.bin'), '/测试目录/测试文件.bin');
    assert.deepEqual(await fs.readFile(path.join(server.root, '测试目录/测试文件.bin')), payload);
    await assert.rejects(client.transferFile('upload', path.join(local, 'source.bin'), '/测试目录/测试文件.bin'), /已存在/);
    assert.deepEqual(await fs.readFile(path.join(server.root, '测试目录/测试文件.bin')), payload);
    await client.rename('/测试目录/测试文件.bin', '/测试目录/renamed.bin');
    await client.transferFile('download', path.join(local, 'download.bin'), '/测试目录/renamed.bin');
    assert.deepEqual(await fs.readFile(path.join(local, 'download.bin')), payload);
    assert.ok(events.some(event => event.type === 'REMOTE_TRANSFER' && event.data.status === 'complete' && event.data.completed === payload.length));
    await assert.rejects(client.remove('/测试目录'));
    await client.remove('/测试目录/renamed.bin'); await client.remove('/测试目录');
    assert.deepEqual((await client.list('/')).entries, []);
    assert.deepEqual((await fs.readdir(local)).sort(), ['download.bin', 'source.bin']);
    await assert.rejects(client.list('/missing'));
    assert.equal(client.state, true);
});

test('SFTP cancellation removes partial local files and preserves an existing destination', {timeout: 20000}, async t => {
    const {client, server, events} = await setup(t, 6);
    const local = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-sftp-cancel-'));
    t.after(() => fs.rm(local, {recursive: true, force: true}));
    await fs.writeFile(path.join(server.root, 'large.bin'), Buffer.alloc(1024 * 1024, 0xab));
    const destination = path.join(local, 'saved.bin');
    await fs.writeFile(destination, 'original');
    server.slowReads = true;
    await client.connect();
    const transfer = client.transferFile('download', destination, '/large.bin');
    const rejected = assert.rejects(transfer, /取消/);
    await waitFor(() => events.some(event => event.type === 'REMOTE_TRANSFER' && event.data.completed > 0));
    client.cancelTransfer(); await rejected;
    assert.equal(await fs.readFile(destination, 'utf8'), 'original');
    assert.deepEqual(await fs.readdir(local), ['saved.bin']);
    assert.equal(client.state, true);
    assert.equal((await client.list('/')).entries[0].name, 'large.bin');
});

test('SFTP upload cancellation cleans remote temporary files without publishing partial content', {timeout: 20000}, async t => {
    const {client, server, events} = await setup(t, 6);
    const local = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-sftp-upload-cancel-'));
    t.after(() => fs.rm(local, {recursive: true, force: true}));
    const source = path.join(local, 'large.bin');
    await fs.writeFile(source, Buffer.alloc(4 * 1024 * 1024, 0xab));
    server.slowWrites = true;
    await client.connect();
    const transfer = client.transferFile('upload', source, '/cancelled.bin');
    const rejected = assert.rejects(transfer, /取消/);
    await waitFor(() => events.some(event => event.type === 'REMOTE_TRANSFER' && event.data.completed > 0));
    client.cancelTransfer(); await rejected;
    assert.deepEqual(await fs.readdir(server.root), []);
    assert.equal(client.state, true);
});

test('SFTP peer disconnect rejects active transfers and removes local partial files', {timeout: 20000}, async t => {
    const {client, server, events} = await setup(t, 6);
    const local = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-sftp-disconnect-'));
    t.after(() => fs.rm(local, {recursive: true, force: true}));
    await fs.writeFile(path.join(server.root, 'large.bin'), Buffer.alloc(1024 * 1024, 0xab));
    server.slowReads = true;
    await client.connect();
    const transfer = client.transferFile('download', path.join(local, 'download.bin'), '/large.bin');
    const rejected = assert.rejects(transfer);
    await waitFor(() => events.some(event => event.type === 'REMOTE_TRANSFER' && event.data.completed > 0));
    for (const peer of server.clients) peer.end();
    await rejected; await waitFor(() => !client.state);
    assert.deepEqual(await fs.readdir(local), []);
});
