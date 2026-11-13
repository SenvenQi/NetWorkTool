const { app } = require('electron');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { DataSource } = require('typeorm');
const { Device } = require('../dist/database/entities/device');
const { Command } = require('../dist/database/entities/command');
const { DeviceRepo } = require('../dist/database/service/DeviceRepo');
app.whenReady().then(async () => {
    const dataSource = new DataSource({type:'better-sqlite3', database:':memory:', entities:[Device,Command], synchronize:true});
    const ready = dataSource.initialize();
    const repo = new DeviceRepo({dataSource, ready});
    try {
        const results = await Promise.allSettled([
            repo.addDevice('first', 'localhost:1234', '{}', 0, 0),
            repo.addDevice('second', 'localhost:1234', '{}', 0, 0),
        ]);
        console.log('Concurrent insert outcomes:', results.map(r => r.status));
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1, 'Concurrent duplicate inserts must have exactly one winner');
        assert.equal((await repo.getAllDevice()).length, 1, 'Duplicate address must not be persisted');
        await repo.addDevice('next', 'localhost:1235', '{}', 0, 0);
        assert.equal((await repo.getAllDevice()).length, 2, 'A rejected write must not stop later writes');
        console.log('Database concurrency checks passed.');
        await dataSource.destroy(); app.exit(0);
    } catch(error) { console.error(error); await dataSource.destroy(); app.exit(1); }
}).catch(error => { console.error(error); app.exit(1); });
