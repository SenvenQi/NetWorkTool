const { _electron } = require('playwright-core');
const assert = require('node:assert/strict');
const net = require('node:net');
const dgram = require('node:dgram');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');

(async () => {
    const output = path.resolve('test-results/ui');
    await fs.mkdir(output, {recursive: true});
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'networktool-ui-'));
    const sockets = new Set();
    const tcp = net.createServer(socket => {
        sockets.add(socket); socket.on('close', () => sockets.delete(socket));
        socket.on('data', data => socket.write(data));
    }).listen(0, '127.0.0.1');
    await once(tcp, 'listening');
    const udp = dgram.createSocket('udp4');
    udp.bind(0, '127.0.0.1'); await once(udp, 'listening');
    udp.on('message', (data, peer) => udp.send(data, peer.port, peer.address));
    let app;
    try {
        const args = [path.join(__dirname, 'ui-fixture.cjs')];
        if (process.platform === 'linux') args.unshift('--no-sandbox', '--ozone-platform=headless', '--disable-gpu');
        app = await _electron.launch({executablePath: require('electron'), args,
            env: {...process.env, NETWORKTOOL_TEST_USER_DATA: profile}, timeout: 30000});
        const page = await app.firstWindow();
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const cdp = await page.context().newCDPSession(page);
        async function viewport(width, height) {
            await cdp.send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
        }
        async function noOverflow() {
            const dimensions = await page.evaluate(() => ({width: innerWidth, height: innerHeight,
                scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight}));
            assert.ok(dimensions.scrollWidth <= dimensions.width && dimensions.scrollHeight <= dimensions.height, JSON.stringify(dimensions));
            const send = page.getByRole('button', {name: '发送', exact: true});
            if (await send.count() === 1) {
                const rect = await send.boundingBox();
                assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= dimensions.width && rect.y + rect.height <= dimensions.height);
            }
        }
        async function addDevice(name, channel, address, options = {}) {
            await page.getByRole('button', {name: '添加设备', exact: true}).click();
            const dialog = page.getByRole('dialog');
            await dialog.getByLabel('名称', {exact: true}).fill(name);
            await dialog.getByLabel('协议', {exact: true}).selectOption(String(channel));
            if (channel === 1 || channel === 3) await dialog.getByLabel('地址', {exact: true}).selectOption(address);
            else await dialog.getByLabel('地址', {exact: true}).fill(address);
            if (channel === 4) {
                await dialog.getByLabel('目标地址', {exact: true}).fill('127.0.0.1');
                await dialog.getByLabel('目标端口', {exact: true}).fill(String(options.port));
            }
            await dialog.getByRole('button', {name: '确定', exact: true}).click();
            await dialog.waitFor({state: 'hidden'});
            await page.getByText(name, {exact: true}).waitFor();
            assert.equal(await page.getByRole('button', {name: '发送', exact: true}).isEnabled().catch(() => false), false);
            await page.getByRole('button', {name: '连接', exact: true}).click();
            await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        }
        async function sendAndReceive(hex, expected) {
            await page.getByRole('button', {name: '清空', exact: true}).click();
            await page.getByLabel('16进制字符串', {exact: true}).fill(hex);
            await page.getByRole('button', {name: '发送', exact: true}).click();
            await page.getByText(expected, {exact: true}).waitFor();
        }
        async function unusedPort(protocol) {
            const reservation = protocol === 'udp' ? dgram.createSocket('udp4') : net.createServer();
            if (protocol === 'udp') reservation.bind(0, '127.0.0.1'); else reservation.listen(0, '127.0.0.1');
            await once(reservation, 'listening');
            const port = reservation.address().port;
            const closed = once(reservation, 'close'); reservation.close(); await closed;
            return port;
        }
        await viewport(800, 600);
        await page.getByText('添加或选择设备，开始通信测试', {exact: true}).waitFor();
        await noOverflow();
        // Backend rejection must keep the user's input available for correction.
        await page.getByRole('button', {name: '添加设备', exact: true}).click();
        await page.getByRole('dialog').getByLabel('名称', {exact: true}).fill('错误地址测试');
        await page.getByRole('dialog').getByLabel('地址', {exact: true}).fill('127.0.0.1:70000');
        await page.getByRole('dialog').getByRole('button', {name: '确定', exact: true}).click();
        await page.getByRole('dialog').getByRole('button', {name: '确定', exact: true}).waitFor();
        assert.equal(await page.getByRole('dialog').getByLabel('地址', {exact: true}).inputValue(), '127.0.0.1:70000');
        await page.getByRole('dialog').getByRole('button', {name: '取消', exact: true}).click();

        await addDevice('TCP 回显测试', 0, `127.0.0.1:${tcp.address().port}`);
        await sendAndReceive('00 ff 80 0d 0a', '0x00 0xff 0x80 0x0d 0x0a');
        assert.equal(await page.getByRole('button', {name: '添加命令', exact: true}).count(), 0);
        await page.getByRole('button', {name: '常用命令', exact: true}).click();
        await page.getByRole('button', {name: '添加命令', exact: true}).click();
        let dialog = page.getByRole('dialog');
        await dialog.getByLabel('名称', {exact: true}).fill('UTF-8 命令');
        await dialog.getByLabel('命令', {exact: true}).fill('abc');
        await dialog.getByRole('button', {name: '确定', exact: true}).click();
        await dialog.getByRole('button', {name: '确定', exact: true}).waitFor();
        assert.equal(await dialog.getByLabel('命令', {exact: true}).inputValue(), 'abc');
        await dialog.getByLabel('编码', {exact: true}).selectOption('1');
        await dialog.getByLabel('命令', {exact: true}).fill('你好');
        await dialog.getByRole('button', {name: '确定', exact: true}).click();
        await dialog.waitFor({state: 'hidden'});
        await page.getByRole('button', {name: '清空', exact: true}).click();
        await page.getByLabel('常用命令面板', {exact: true}).getByRole('button', {name: '发送', exact: true}).click();
        await page.getByText('0xe4 0xbd 0xa0 0xe5 0xa5 0xbd', {exact: true}).nth(1).waitFor();
        await noOverflow();
        await page.getByRole('alert').last().waitFor({state: 'hidden'});
        await page.screenshot({path: path.join(output, 'commands-800x600.png')});
        await page.getByRole('button', {name: '常用命令', exact: true}).click();
        for (const socket of sockets) socket.destroy();
        await page.getByRole('button', {name: '连接', exact: true}).waitFor();
        assert.equal(await page.getByRole('button', {name: '发送', exact: true}).isEnabled(), false);
        await page.getByRole('button', {name: '连接', exact: true}).click();
        await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        await sendAndReceive('01 02', '0x01 0x02');
        await page.reload();
        await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        await sendAndReceive('03 04', '0x03 0x04');
        console.log('UI: TCP echo, peer disconnect/reconnect, renderer reload and command validation passed.');

        await addDevice('UDP 回显测试', 4, String(await unusedPort('udp')), {port: udp.address().port});
        await sendAndReceive('55 aa 00 ff', '0x55 0xaa 0x00 0xff');
        await page.getByRole('button', {name: '断开连接', exact: true}).click();
        await page.getByRole('button', {name: '连接', exact: true}).click();
        await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        await sendAndReceive('a1 b2', '0xa1 0xb2');
        console.log('UI: UDP custom target and reconnect passed.');

        const hardware = await app.evaluate(() => ({serialPath: global.simulatedHardware.serialPath, hidPath: global.simulatedHardware.hidPath}));
        await addDevice('串口模拟测试', 1, hardware.serialPath);
        await sendAndReceive('00 ff 80', '0x00 0xff 0x80');
        await app.evaluate(() => new Promise((resolve, reject) => global.simulatedHardware.serialPorts.at(-1).close(error => error ? reject(error) : resolve())));
        await page.getByRole('button', {name: '连接', exact: true}).waitFor();
        await page.getByRole('button', {name: '连接', exact: true}).click();
        await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        await sendAndReceive('11 22', '0x11 0x22');
        await addDevice('HID 模拟测试', 3, hardware.hidPath);
        await sendAndReceive('00 ff 01', '0x00 0xff 0x01');
        await app.evaluate(() => { global.simulatedHardware.hidDevices.at(-1).failNextWrite = true; });
        await page.getByRole('button', {name: '发送', exact: true}).click();
        await page.getByRole('button', {name: '连接', exact: true}).waitFor();
        assert.equal(await page.getByRole('button', {name: '发送', exact: true}).isEnabled(), false);
        await page.getByRole('button', {name: '连接', exact: true}).click();
        await page.getByRole('button', {name: '断开连接', exact: true}).waitFor();
        await sendAndReceive('00 02', '0x00 0x02');
        console.log('UI: simulated serial/HID echo, disconnect and write failure recovery passed.');

        const port = await unusedPort('tcp');
        await addDevice('HTTP 监听测试', 2, String(port));
        assert.equal(await page.getByRole('button', {name: '发送', exact: true}).count(), 0);
        const body = '中文内容\n' + 'a'.repeat(1000);
        const response = await fetch(`http://127.0.0.1:${port}`, {method: 'POST', body});
        assert.equal(response.status, 200);
        await response.text();
        await page.getByText(body, {exact: true}).waitFor();
        await page.getByRole('button', {name: '复制文本', exact: true}).click();
        assert.equal(await app.evaluate(({clipboard}) => clipboard.readText()), body);
        await noOverflow();
        await page.getByRole('alert').last().waitFor({state: 'hidden'});
        await page.screenshot({path: path.join(output, 'http-800x600.png')});
        await page.getByRole('button', {name: '展开导航', exact: true}).click();
        await page.getByRole('button', {name: '收起导航', exact: true}).waitFor();
        await noOverflow();
        await viewport(1280, 800);
        await noOverflow();
        await page.screenshot({path: path.join(output, 'http-1280x800.png')});
        await page.getByRole('button', {name: '删除设备', exact: true}).click();
        await page.getByText('HTTP 监听测试', {exact: true}).waitFor({state: 'hidden'});
        await assert.rejects(fetch(`http://127.0.0.1:${port}`, {signal: AbortSignal.timeout(3000)}));
        assert.deepEqual(errors, []);
        console.log('UI: HTTP receive/copy/delete, long content, 800×600 and 1280×800 layout passed; no renderer exceptions.');
    } catch (error) {
        if (app) await (await app.firstWindow()).screenshot({path: path.join(output, 'failure.png')}).catch(() => {});
        throw error;
    } finally {
        await app?.close();
        for (const socket of sockets) socket.destroy();
        tcp.close(); udp.close();
        await fs.rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100});
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
