// Test-only transport substitution. Production code still uses the native drivers.
const Module = require('node:module');
const { EventEmitter } = require('node:events');
const serial = require('serialport');
const serialPorts = [];
const hidDevices = [];
const serialPath = process.platform === 'win32' ? 'COM_TEST' : '/dev/TEST_ECHO';
const hidPath = 'test-hid-echo';
serial.SerialPortMock.binding.createPort(serialPath, { echo: true, record: true });
class SerialPort extends serial.SerialPortMock {
    constructor(options) { super(options); serialPorts.push(this); }
}
class HID extends EventEmitter {
    constructor(path) {
        super();
        if (path !== hidPath) throw new Error('HID device not found');
        this.closed = false;
        this.writes = [];
        hidDevices.push(this);
    }
    write(data) {
        if (this.closed || this.failNextWrite) {
            this.failNextWrite = false;
            throw new Error('HID write failed: device disconnected');
        }
        const bytes = Buffer.from(data);
        this.writes.push(bytes);
        setImmediate(() => { if (!this.closed) this.emit('data', bytes); });
        return bytes.length;
    }
    close() { this.closed = true; }
}
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'serialport') return { ...serial, SerialPort };
    if (request === 'node-hid') return { HID, devices: () => [{ path: hidPath, product: '模拟 HID 回显设备' }] };
    return originalLoad.call(this, request, parent, isMain);
};
module.exports = { serialPorts, hidDevices, serialPath, hidPath };
