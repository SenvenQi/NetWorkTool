const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const hardware = require('./helpers/simulated-hardware.cjs');
const DeviceManager = require('../dist/deviceManager/deviceManager').default;
const { MessageType } = require('../dist/domains/messageType');
function setup(t) {
    const events = [];
    const manager = new DeviceManager({ sendMessage: event => events.push(event) });
    t.after(() => { for (const device of [...manager.deviceClients]) manager.removeDeviceClient(device.address); });
    return { manager, events };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('serial simulation preserves bytes and baud rate, handles unplug, and reconnects', {timeout: 5000}, async t => {
    const { manager, events } = setup(t);
    const config = { address: hardware.serialPath, deviceChannelType: 1, deviceType: 0, options: {baudRate: 115200} };
    for (let attempt = 0; attempt < 2; attempt++) {
        manager.addDeviceClient(config);
        const port = hardware.serialPorts.at(-1);
        await once(port, 'open');
        assert.equal(port.baudRate, 115200);
        assert.equal(manager.deviceClients[0].state, true);
        const data = once(port, 'data');
        manager.sendMessageByAddress(config.address, Buffer.from([0, 255, 128, 13, 10]));
        assert.deepEqual((await data)[0], Buffer.from([0, 255, 128, 13, 10]));
        assert.deepEqual(port.port.recording, Buffer.from([0, 255, 128, 13, 10]));
        await new Promise((resolve, reject) => port.close(error => error ? reject(error) : resolve()));
        assert.equal(manager.deviceClients[0].state, false);
        assert.throws(() => manager.sendMessageByAddress(config.address, Buffer.from([1])), /未连接/);
    }
    assert.equal(events.filter(e => e.data.messageType === MessageType.Info).length, 2);
});

test('serial disposal during open releases the port and suppresses stale events', {timeout: 5000}, async t => {
    const { manager, events } = setup(t);
    const config = { address: hardware.serialPath, deviceChannelType: 1, deviceType: 0, options: {baudRate: 9600} };
    manager.addDeviceClient(config);
    const port = hardware.serialPorts.at(-1);
    const closed = once(port, 'close');
    manager.removeDeviceClient(config.address);
    const count = events.length;
    await closed;
    port.emit('data', Buffer.from('late'));
    port.emit('error', new Error('late error'));
    assert.equal(port.isOpen, false);
    assert.equal(events.length, count);
    manager.addDeviceClient(config);
    await once(hardware.serialPorts.at(-1), 'open');
    assert.equal(manager.deviceClients[0].state, true);
});

test('missing serial devices fail cleanly without blocking a later connection', {timeout: 5000}, async t => {
    const { manager } = setup(t);
    const config = { address: '/missing-port', deviceChannelType: 1, deviceType: 0, options: {baudRate: 9600} };
    manager.addDeviceClient(config);
    await once(hardware.serialPorts.at(-1), 'error');
    assert.equal(manager.deviceClients[0].state, false);
    manager.addDeviceClient({...config, address: hardware.serialPath});
    await once(hardware.serialPorts.at(-1), 'open');
    assert.equal(manager.deviceClients[1].state, true);
});

test('HID simulation preserves report ID and bytes, ignores stale events, and reconnects after unplug', async t => {
    const { manager, events } = setup(t);
    const config = { address: hardware.hidPath, deviceChannelType: 3, deviceType: 0, options: {} };
    manager.addDeviceClient(config);
    const first = hardware.hidDevices.at(-1);
    manager.sendMessageByAddress(config.address, Buffer.from([0, 255, 128]));
    await tick();
    assert.deepEqual(first.writes[0], Buffer.from([0, 255, 128]));
    assert.equal(events.filter(e => e.data.messageType === MessageType.Info).length, 1);
    first.emit('error', new Error('unplugged'));
    assert.equal(manager.deviceClients[0].state, false);
    manager.addDeviceClient(config);
    assert.equal(first.closed, true);
    assert.equal(manager.deviceClients[0].state, true);
    const count = events.length;
    first.emit('data', Buffer.from('late'));
    first.emit('error', new Error('late error'));
    assert.equal(events.length, count);
});

test('synchronous HID write failure clears connection state and allows reconnect', async t => {
    const { manager } = setup(t);
    const config = { address: hardware.hidPath, deviceChannelType: 3, deviceType: 0, options: {} };
    manager.addDeviceClient(config);
    const first = hardware.hidDevices.at(-1);
    first.failNextWrite = true;
    assert.throws(() => manager.sendMessageByAddress(config.address, Buffer.from([0, 1])), /HID write failed/);
    assert.equal(manager.deviceClients[0].state, false);
    manager.addDeviceClient(config);
    assert.notEqual(hardware.hidDevices.at(-1), first);
    assert.equal(manager.deviceClients[0].state, true);
});
