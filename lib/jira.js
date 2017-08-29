/*jshint esversion: 6, node: true*/
'use strict';
const Https = require('https');

function createJira(item) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.host,
            port: this.settings.port,
            path: '/rest/api/2/issue/',
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.user + ':' + this.settings.pass).toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        console.log(`Posting to Jira for ${item.id} URL:${options.host}${options.path}`);

        const req = Https.request(options, (res) => {

            let data = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {

                data += chunk;
            });
            res.on('end', () => {

                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`Failed to post data for ${item.id}, status code: ${res.statusCode}. Error: ${data}`));
                }

                data = JSON.parse(data);
                resolve({
                    data,
                    statusCode: res.statusCode
                })
            });
        });

        req.on('error', (err) => reject(err));

        const requestBody = JSON.stringify({
            fields: {
                project: {
                    key: this.settings.jira.project_key
                },
                summary: `${item.id} : ${item.type}`,
                description: item.description,
                issuetype: {
                    name: this.settings.jira.issuetype_name
                },
                customfield_10008: this.settings.jira.epicToLink,
                customfield_10803: item.id,
                assignee: {
                    name: this.settings.jira.assignee_name
                },
                fixVersions: [
                    {
                        id: this.settings.jira.fixVersion_id
                    }
                ]
            }
        });

        req.write(requestBody);
        req.end();
    });
}

function createRemoteLink(key) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.host,
            port: this.settings.port,
            path: `/rest/api/2/issue/${key}/remotelink`,
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.user + ':' + this.settings.pass).toString('base64'),
                'Content-Type': 'application/json'
            }
        };

        console.log(`Posting to Jira for ${key} URL:${options.host}${options.path}`);

        const req = Https.request(options, (res) => {

            let data = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {

                data += chunk;
            });
            res.on('end', () => {

                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`Failed to POST data for ${key}, status code: ${res.statusCode}. Error: ${data}`));
                }

                data = JSON.parse(data);
                resolve({
                    data,
                    statusCode: res.statusCode
                })
            });
        });

        req.on('error', (err) => reject(err));

        const requestBody = JSON.stringify({
            'globalId': `appId=${this.settings.jira.confluence_appId}&pageId=${this.settings.confluence.pageId}`,
            'application': {
                'type': 'com.atlassian.confluence',
                'name': `Confluence (${this.settings.atlassian.host})`
            },
            'relationship': 'Wiki Page',
            'object': {
                'url': `${this.settings.atlassian.port==443 ? 'https://' : 'http://'}${this.settings.atlassian.host}/wiki/pages/viewpage.action?pageId=${this.settings.confluence.pageId}`,
                'title': 'Wiki Page',
            }
        });

        req.write(requestBody);
        req.end();
    });
}


function createJiraClient(settings) {

    return {
        createJira,
        createRemoteLink,
        settings
    };
}

exports.createJiraClient = createJiraClient;
