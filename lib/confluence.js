/*jshint esversion: 6, node: true*/
'use strict';
const Https = require('https');

function getConfluenceDataAsync(path) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.atlassian.host,
            port: this.settings.atlassian.port,
            path: `/wiki/rest/api/content?spaceKey=${this.settings.confluence.spaceKey}&title=${encodeURIComponent(path)}&expand=body.view,body.storage,version`,
            method: 'GET',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.atlassian.user + ':' + this.settings.atlassian.pass).toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        console.log(`Trying to get Confluence data from ${options.host}:${options.port}${options.path}`);

        const req = Https.request(options, (res) => {

            let data = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {

                data += chunk;
            });
            res.on('end', () => {

                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`Failed to get data for ${options.path}, status code: ${res.statusCode}. Error: ${data}`));
                }

                data = JSON.parse(data);
                resolve({
                    data,
                    statusCode: res.statusCode
                })
            });
        });

        req.on('error', (err) => reject(err));

        req.end();
    });
}

function postConfluenceDataAsync(id, page) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.atlassian.host,
            port: this.settings.atlassian.port,
            path: `/wiki/rest/api/content/${id}`,
            method: 'PUT',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.atlassian.user + ':' + this.settings.atlassian.pass).toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        console.log(`Trying to PUT Confluence data to ${options.host}:${options.port}${options.path}`);

        const req = Https.request(options, (res) => {

            let data = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {

                data += chunk;
            });
            res.on('end', () => {

                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`Failed to PUT data for ${options.path}, status code: ${res.statusCode}, error: ${data}`));
                }

                data = JSON.parse(data);
                resolve(`Updated confluence ${options.host}:${options.port}${options.path} with status code ${res.statusCode}`);
            });
        });

        req.on('error', (err) => reject(err));

        req.write(page);
        req.end();
    });
}

function createConfluenceClient(settings) {

    return {
        getConfluenceDataAsync,
        postConfluenceDataAsync,
        settings
    };
}

exports.createConfluenceClient = createConfluenceClient;
