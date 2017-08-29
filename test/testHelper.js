/*jshint esversion: 6, node: true*/
'use strict';
const fs = require('fs');
const path = require('path');

const helper = {

    getSettings: function() {

        const data = fs.readFileSync(path.join(__dirname, '../default.json'), 'utf8');
        return JSON.parse(data);
    }
};

module.exports = helper;
