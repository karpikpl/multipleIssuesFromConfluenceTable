/*jshint esversion: 6, node: true*/
'use strict';
const ReadFile = require('fs-readfile-promise');
const co = require('co');
const Main = require('./lib/main');

if (process.argv.length < 3) {
    return console.log('Please provide settings file path as first argument!');
}

co(function* () {

    const settingsFile = process.argv[2];
    console.log(`Reading ${settingsFile} settings file.`);

    const settingsBuffer = yield ReadFile(settingsFile);
    const settings = JSON.parse(settingsBuffer.toString('utf8'));

    // run main method
    return Main.createJirasUpdateConfluence(settings);
})
.then((res) => console.log('Operation completed!', (res && res.statusCode) || ''))
.catch((err) => console.error('Operation failed.', err));;
