const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
    const binary = process.argv[2] || (process.platform === 'win32'
        ? 'build/win-unpacked/网络测试工具.exe' : 'build/linux-unpacked/tool');
    const reservation = net.createServer().listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    reservation.close(); await once(reservation, 'close');
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
            const timeout = setTimeout(() => reject(new Error('Packaged renderer timed out')), 10000);
            ws.onopen = () => ws.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {
                expression: `(async () => { await window.api.send('device/loadData'); return {title:document.title, api:typeof window.api.send, node:typeof require}; })()`,
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
        assert.deepEqual(result, {title:'网络测试工具', api:'function', node:'undefined'});
        console.log('Packaged application passed: local renderer, preload, IPC and database.');
    } finally {
        ws?.close(); child.kill();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
