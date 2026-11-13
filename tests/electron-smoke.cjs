// Run with Electron; the temporary profile never touches the user's database.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const assert = require('node:assert/strict');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'networktool-smoke-'));
app.setPath('userData', profile);
const Database = require('better-sqlite3');
const db = new Database(path.join(profile, 'desktopApp.db'));
db.exec(`CREATE TABLE device (id varchar PRIMARY KEY NOT NULL, address varchar NOT NULL, name varchar NOT NULL, option varchar NOT NULL, type integer NOT NULL, channelType integer NOT NULL);
CREATE TABLE command (id varchar PRIMARY KEY NOT NULL, name varchar NOT NULL, hexString varchar NOT NULL);
INSERT INTO device VALUES ('existing', '127.0.0.1:1', '已有设备', '{}', 0, 0);
INSERT INTO command VALUES ('existing', '已有命令', '00ff');`);
db.close();
const server = net.createServer(socket => socket.on('data', data => socket.write(data)));
const deadline = setTimeout(() => { console.error('Electron smoke test timed out'); app.exit(1); }, 45000);
let failure;
app.on('web-contents-created', (_event, contents) => {
    contents.on('preload-error', (_event, _path, error) => { failure = error; });
    contents.on('render-process-gone', (_event, details) => { failure = new Error(JSON.stringify(details)); });
});
app.once('browser-window-created', (_event, window) => {
    window.webContents.once('did-finish-load', async () => {
        try {
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            const address = `127.0.0.1:${server.address().port}`;
            const result = await window.webContents.executeJavaScript(`(async () => {
                const api = window.api;
                const exchange = async (action, data, type) => {
                    let unsubscribe;
                    const event = new Promise(resolve => {
                        unsubscribe = api.receive('PackageMessage', message => {
                            if (message.type === type) resolve(message.data);
                        });
                    });
                    try { await api.send('device/' + action, data); return await event; }
                    finally { unsubscribe(); }
                };
                const devices = await exchange('loadData', undefined, 'CALL_BACK_INIT_DATA');
                if (!devices.some(d => d.name === '已有设备')) throw new Error('Existing database was not preserved');
                const commands = await exchange('loadCommand', undefined, 'CALL_BACK_INIT_COMMAND_DATA');
                if (commands[0].hexString[1] !== 255) throw new Error('Existing command changed');
                let blocked = false;
                try { await api.send('device/constructor'); } catch { blocked = true; }
                if (!blocked) throw new Error('Unsafe IPC route accepted');
                const address = ${JSON.stringify(address)};
                await exchange('addDevice', {name:'回环测试', address, option:{}, deviceType:0, deviceChannelType:'0'}, 'CALL_BACK_ADD_DEVICE');
                let duplicate = false;
                try { await api.send('device/addDevice', {name:'重复', address, option:{}, deviceType:0, deviceChannelType:0}); } catch { duplicate = true; }
                if (!duplicate) throw new Error('Duplicate device accepted');
                await exchange('connectDevice', {address}, 'RECIVE_MESSAGE');
                const received = await exchange('sendMessage', {address, message:'00ff'}, 'RECIVE_MESSAGE');
                if (received.message.message[1] !== 255) throw new Error('TCP round trip failed');
                const command = await exchange('addCommand', {name:'UTF-8', type:1, command:'你好'}, 'CALL_BACK_ADD_COMMAND');
                if (command.hexString.length !== 6) throw new Error('Text command encoding failed');
                await exchange('closeDevice', address, 'RECIVE_MESSAGE');
                await exchange('removeDevice', address, 'CALL_BACK_REMOVE_DEVICE');
                return {title: document.title, text: document.body.innerText, nodeIntegration: typeof require};
            })()`);
            if (failure) throw failure;
            assert.equal(result.title, '网络测试工具');
            assert.equal(result.nodeIntegration, 'undefined');
            assert.match(result.text, /已有设备/);
            const screenshot = await window.webContents.capturePage();
            fs.writeFileSync(path.join(os.tmpdir(), 'networktool-smoke.png'), screenshot.toPNG());
            console.log('Electron smoke passed: existing SQLite data, renderer/preload, IPC rejection, device CRUD, TCP echo, UTF-8 commands, screenshot.');
            clearTimeout(deadline); server.close(); app.exit(0);
        } catch (error) { console.error(error); clearTimeout(deadline); server.close(); app.exit(1); }
    });
});
require('../dist/main.js');
