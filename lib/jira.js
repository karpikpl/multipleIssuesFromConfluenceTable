/*jshint esversion: 6, node: true*/
'use strict';
const Https = require('https');

function createJira(item) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.atlassian.host,
            port: this.settings.atlassian.port,
            path: '/rest/api/2/issue/',
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.atlassian.user + ':' + this.settings.atlassian.pass).toString('base64'),
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

        const requestBody = JSON.stringify(createJiraPayload(item, this.settings));

        req.write(requestBody);
        req.end();
    });
}

function createRemoteLink(key) {

    return new Promise((resolve, reject) => {

        const options = {
            host: this.settings.atlassian.host,
            port: this.settings.atlassian.port,
            path: `/rest/api/2/issue/${key}/remotelink`,
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + new Buffer(this.settings.atlassian.user + ':' + this.settings.atlassian.pass).toString('base64'),
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

function createJiraPayload(item, settings) {

    const payload = {
        fields: {
            project: {
                key: settings.jira.project_key
            },
            summary: item.title,
            description: item.description,
            issuetype: {
                name: settings.jira.issueType_name
            }
        }
    };

    // customfield_10009 : Epic Name is required.
    if (settings.jira.issueType_name === 'Epic') {
        payload.fields.customfield_10009 = item.id;
    }

    if (settings.jira.customfield_for_id) {
        payload.fields[settings.jira.customfield_for_id] = item.id;
    }

    if (settings.jira.epicToLink) {
        payload.fields.customfield_10008 = settings.jira.epicToLink;
    }

    if (settings.jira.assignee_name) {
        payload.fields.assignee = {
            name: settings.jira.assignee_name
        };
    }

    if (settings.jira.fixVersion_id) {
        payload.fields.fixVersions = [{
            id: settings.jira.fixVersion_id
    }];
    }

    if (item.priority) {
        payload.fields.priority = {
            name: mapPriority(item.priority)
        };
    }

    return payload;
}

function mapPriority(priority) {

    if (!priority) return '';

    // Highest, High, Medium, Low, Lowest
    if (priority.match(/Critical|Highest/i))
        return 'Highest';
    if (priority.match(/High/i))
        return 'High';
    if (priority.match(/Medium/i))
        return 'Medium';
    if (priority.match(/Low/i))
        return 'Low';
    if (priority.match(/Lowest/i))
        return 'Lowest';

    return '';
}

function createJiraClient(settings) {

    return {
        createJira,
        createRemoteLink,
        createJiraPayload,
        mapPriority,
        settings
    };
}

exports.createJiraClient = createJiraClient;
