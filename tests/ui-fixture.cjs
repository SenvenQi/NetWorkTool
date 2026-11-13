const { app } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
app.setPath('userData', process.env.NETWORKTOOL_TEST_USER_DATA || fs.mkdtempSync(path.join(os.tmpdir(), 'networktool-ui-')));
global.simulatedHardware = require('./helpers/simulated-hardware.cjs');
require('../dist/main.js');
