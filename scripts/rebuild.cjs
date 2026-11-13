// HID and serialport ship ABI-stable Node-API binaries. Rebuild only SQLite,
// whose binary is coupled to Electron's V8 ABI, before collecting dependencies.
module.exports = async context => {
    if (context.electronPlatformName !== process.platform) {
        throw new Error('Build native installers on the target operating system.');
    }
    const { rebuild } = await import('@electron/rebuild');
    const { Arch } = require('builder-util');
    await rebuild({buildPath: context.packager.info.appDir,
        electronVersion: context.packager.config.electronVersion,
        arch: Arch[context.arch], onlyModules: ['better-sqlite3']});
};
