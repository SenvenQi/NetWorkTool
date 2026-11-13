const { app } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
app.setPath('userData', process.env.NETWORKTOOL_TEST_USER_DATA || fs.mkdtempSync(path.join(os.tmpdir(), 'networktool-ui-')));
global.simulatedHardware = require('./helpers/simulated-hardware.cjs');
const {dialog} = require('electron');
global.testFileDialogs = {open: null, save: null};
dialog.showOpenDialog = async () => ({canceled: !global.testFileDialogs.open, filePaths: global.testFileDialogs.open ? [global.testFileDialogs.open] : []});
dialog.showSaveDialog = async () => ({canceled: !global.testFileDialogs.save, filePath: global.testFileDialogs.save || undefined});
global.readSavedDevices = () => {
    const Database = require('better-sqlite3');
    const database = new Database(path.join(app.getPath('userData'), 'desktopApp.db'), {readonly: true});
    try { return database.prepare('SELECT * FROM device').all(); } finally { database.close(); }
};
require('../dist/main.js');
