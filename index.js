/*jshint esversion: 6, node: true*/
'use strict';
const ReadFile = require('fs-readfile-promise');
const Main = require('./lib/main');

if (process.argv.length < 3) {
    return console.log('Please provide settings file path as first argument!');
}

const run = async function () {

    try {
        const settingsFile = process.argv[2];
        console.log(`Reading ${settingsFile} settings file.`);

        const settingsBuffer = await ReadFile(settingsFile);
        const settings = JSON.parse(settingsBuffer.toString('utf8'));

        // run main method
        const res = await Main.createJirasUpdateConfluence(settings);

        console.log('Operation completed!', (res && res.statusCode) || res)

    } catch (err) {
        console.error('Operation failed.', err);
        process.exit(1);
    }
};

run();
