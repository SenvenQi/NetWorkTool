const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createSshServer} = require('./helpers/ssh-server.cjs');
(async () => {
    const binary = process.argv[2] || (process.platform === 'win32'
        ? 'build/win-unpacked/网络测试工具.exe' : 'build/linux-unpacked/tool');
    const reservation = net.createServer().listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    reservation.close(); await once(reservation, 'close');
    const server = await createSshServer();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'networktool-packaged-'));
    const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`];
    if (process.platform === 'linux') args.push('--no-sandbox', '--ozone-platform=headless', '--disable-gpu');
    const child = spawn(path.resolve(binary), args, {stdio: ['ignore', 'pipe', 'pipe']});
    let logs = '';
    child.stdout.on('data', data => logs += data);
    child.stderr.on('data', data => logs += data);
    child.on('error', error => logs += error.message);
    let ws;
    try {
        const deadline = Date.now() + 30000;
        let target;
        while (Date.now() < deadline && !target) {
            try {
                const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
                target = pages.find(page => page.type === 'page' && page.url.includes('app.asar/dist/service/out/index.html'));
            } catch {}
            if (!target) await new Promise(resolve => setTimeout(resolve, 200));
        }
        assert.ok(target, `Packaged renderer failed to load: ${logs}`);
        ws = new WebSocket(target.webSocketDebuggerUrl);
        const result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Packaged renderer timed out')), 30000);
            ws.onopen = () => ws.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {
                expression: `(async () => {
                    await window.api.send('device/loadData');
                    const address = ${JSON.stringify(`127.0.0.1:${server.port}`)};
                    const auth = ${JSON.stringify({username: 'tester', password: 'test-password', hostKey: server.fingerprint})};
                    for (const [scheme, channel] of [['ssh', 5], ['sftp', 6]]) {
                        await window.api.send('device/addDevice', {name: scheme, address, deviceType: 0, deviceChannelType: channel, option: {username: 'tester'}});
                        await window.api.send('device/connectRemote', {address: scheme + '://' + address, auth});
                    }
                    await window.api.send('device/remoteWrite', {address: 'ssh://' + address, text: 'echo packaged-ok\\r'});
                    let ssh = false;
                    for (let attempt = 0; attempt < 60; attempt++) {
                        const snapshot = await window.api.send('device/remoteSnapshot', 'ssh://' + address);
                        ssh = new TextDecoder().decode(new Uint8Array(snapshot.bytes)).includes('packaged-ok');
                        if (ssh) break;
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    await window.api.send('device/sftpAction', {address: 'sftp://' + address, action: 'mkdir', path: '/packaged-check'});
                    const listing = await window.api.send('device/sftpAction', {address: 'sftp://' + address, action: 'list', path: '/'});
                    const sftp = listing.entries.some(entry => entry.name === 'packaged-check' && entry.directory);
                    await window.api.send('device/sftpAction', {address: 'sftp://' + address, action: 'remove', path: '/packaged-check'});
                    return {title:document.title, api:typeof window.api.send, node:typeof require, ssh, sftp};
                })()`,
                awaitPromise: true, returnByValue: true,
            }}));
            ws.onerror = error => { clearTimeout(timeout); reject(error); };
            ws.onmessage = event => {
                const message = JSON.parse(event.data);
                if (message.id !== 1) return;
                clearTimeout(timeout);
                if (message.result?.exceptionDetails || message.error) reject(new Error(JSON.stringify(message)));
                else resolve(message.result.result.value);
            };
        });
        assert.deepEqual(result, {title:'网络测试工具', api:'function', node:'undefined', ssh:true, sftp:true});
        console.log('Packaged application passed: local renderer, preload, IPC, database, SSH shell and SFTP operations.');
    } finally {
        ws?.close(); child.kill();
        await server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
