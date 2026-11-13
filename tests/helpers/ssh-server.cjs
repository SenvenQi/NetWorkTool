// Real SSH/SFTP protocol fixture; all file access is confined to a temporary root.
const {Server, utils} = require('ssh2');
const {generateKeyPairSync, createHash, createPrivateKey} = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {once} = require('node:events');
const keyPair = () => generateKeyPairSync('rsa', {modulusLength: 2048, privateKeyEncoding: {type: 'pkcs1', format: 'pem'}, publicKeyEncoding: {type: 'spki', format: 'pem'}});

async function createSshServer() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-sftp-server-'));
    const hostKey = keyPair().privateKey;
    const privateKey = keyPair().privateKey;
    const userKey = utils.parseKey(privateKey);
    const encryptedPrivateKey = createPrivateKey(privateKey).export({type: 'pkcs1', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'key-passphrase'});
    const fingerprint = 'SHA256:' + createHash('sha256').update(utils.parseKey(hostKey).getPublicSSH()).digest('base64').replace(/=+$/, '');
    const clients = new Set();
    const windows = [];
    const authenticated = [];
    const fixture = {root, privateKey, encryptedPrivateKey, fingerprint, clients, windows, authenticated, slowReads: false};
    const server = new Server({hostKeys: [hostKey]}, client => {
        clients.add(client);
        client.on('error', () => {});
        client.on('close', () => clients.delete(client));
        client.on('authentication', context => {
            if (context.username !== 'tester') return context.reject();
            if (context.method === 'password' && context.password === 'test-password') { authenticated.push('password'); return context.accept(); }
            if (context.method === 'publickey' && context.key.data.equals(userKey.getPublicSSH()) && (!context.signature || userKey.verify(context.blob, context.signature, context.hashAlgo))) {
                authenticated.push('publickey'); return context.accept();
            }
            context.reject(['password', 'publickey']);
        });
        client.on('ready', () => client.on('session', accept => {
            const session = accept();
            session.on('pty', (accept, _reject, info) => { windows.push(info); accept(); });
            session.on('window-change', (accept, _reject, info) => { windows.push(info); accept?.(); });
            session.on('shell', accept => {
                const stream = accept();
                stream.on('error', () => {});
                stream.write('欢迎 SSH 模拟终端\r\n$ ');
                let line = '';
                stream.on('data', bytes => {
                    const text = bytes.toString('utf8');
                    stream.write(text.replace(/\r/g, '\r\n'));
                    line += text;
                    if (!line.includes('\r') && !line.includes('\n')) return;
                    const command = line.trim(); line = '';
                    if (command === 'exit') { stream.exit(0); stream.end(); return; }
                    const result = command === 'pwd' ? '/home/tester' : command.startsWith('echo ') ? command.slice(5) : `executed: ${command}`;
                    stream.write(result + '\r\n$ ');
                });
            });
            session.on('sftp', accept => serveSftp(accept(), fixture));
        }));
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    fixture.port = server.address().port;
    fixture.close = async () => {
        for (const client of clients) client.end();
        await new Promise(resolve => server.close(resolve));
        await fs.rm(root, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
    };
    return fixture;
}
function serveSftp(stream, fixture) {
    const {STATUS_CODE, flagsToString} = utils.sftp;
    const handles = new Map(); let next = 1;
    const local = remote => path.join(fixture.root, path.posix.normalize('/' + remote).slice(1));
    const attrs = info => ({mode: info.mode, uid: info.uid, gid: info.gid, size: info.size, atime: Math.floor(info.atimeMs / 1000), mtime: Math.floor(info.mtimeMs / 1000)});
    const fail = (id, error) => stream.status(id, error.code === 'ENOENT' ? STATUS_CODE.NO_SUCH_FILE : error.code === 'EACCES' ? STATUS_CODE.PERMISSION_DENIED : STATUS_CODE.FAILURE, error.message);
    const handle = value => { const buffer = Buffer.alloc(4); buffer.writeUInt32BE(next++); handles.set(buffer.toString('hex'), value); return buffer; };
    const get = buffer => handles.get(buffer.toString('hex'));
    const request = (event, handler) => stream.on(event, (id, ...args) => { Promise.resolve().then(() => handler(id, ...args)).catch(error => fail(id, error)); });
    stream.on('error', () => {});
    stream.on('close', () => { for (const item of handles.values()) item.file?.close().catch(() => {}); handles.clear(); });
    request('REALPATH', async (id, remote) => { const filename = path.posix.normalize('/' + remote); await fs.stat(local(remote)); stream.name(id, [{filename, longname: filename, attrs: {}}]); });
    for (const event of ['STAT', 'LSTAT']) request(event, async (id, remote) => stream.attrs(id, attrs(await fs[event === 'STAT' ? 'stat' : 'lstat'](local(remote)))));
    request('OPENDIR', async (id, remote) => stream.handle(id, handle({directory: local(remote), entries: await fs.readdir(local(remote)), read: false})));
    request('READDIR', async (id, token) => {
        const item = get(token);
        if (!item || item.read) return stream.status(id, STATUS_CODE.EOF);
        item.read = true;
        const entries = await Promise.all(item.entries.map(async filename => ({filename, longname: filename, attrs: attrs(await fs.lstat(path.join(item.directory, filename)))})));
        entries.length ? stream.name(id, entries) : stream.status(id, STATUS_CODE.EOF);
    });
    request('OPEN', async (id, remote, flags) => stream.handle(id, handle({file: await fs.open(local(remote), flagsToString(flags))})));
    request('FSTAT', async (id, token) => stream.attrs(id, attrs(await get(token).file.stat())));
    request('READ', async (id, token, offset, length) => {
        if (fixture.slowReads) await new Promise(resolve => setTimeout(resolve, 50));
        const buffer = Buffer.alloc(length);
        const {bytesRead} = await get(token).file.read(buffer, 0, length, offset);
        bytesRead ? stream.data(id, buffer.subarray(0, bytesRead)) : stream.status(id, STATUS_CODE.EOF);
    });
    request('WRITE', async (id, token, offset, data) => { if (fixture.slowWrites) await new Promise(resolve => setTimeout(resolve, 50)); await get(token).file.write(data, 0, data.length, offset); stream.status(id, STATUS_CODE.OK); });
    request('CLOSE', async (id, token) => { const item = get(token); await item?.file?.close(); handles.delete(token.toString('hex')); stream.status(id, STATUS_CODE.OK); });
    request('MKDIR', async (id, remote) => { await fs.mkdir(local(remote)); stream.status(id, STATUS_CODE.OK); });
    request('RMDIR', async (id, remote) => { await fs.rmdir(local(remote)); stream.status(id, STATUS_CODE.OK); });
    request('REMOVE', async (id, remote) => { await fs.unlink(local(remote)); stream.status(id, STATUS_CODE.OK); });
    request('RENAME', async (id, from, to) => {
        try { await fs.lstat(local(to)); throw Object.assign(new Error('Destination exists'), {code: 'EEXIST'}); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        await fs.rename(local(from), local(to)); stream.status(id, STATUS_CODE.OK);
    });
}
module.exports = {createSshServer};
