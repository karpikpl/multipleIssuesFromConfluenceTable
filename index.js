/*jshint esversion: 6, node: true*/
'use strict';
const co = require('co');
const ReadFile = require('fs-readfile-promise');

const Confluence = require('./lib/confluence');
const Jira = require('./lib/jira');
const Xml = require('./lib/xml');

if (process.argv.length < 3) {
    return console.log('Please provide settings file path as first argument!');
}

co(function*() {

    const settingsFile = process.argv[2];
    console.log(`Reading ${settingsFile} settings file.`);

    const settingsBuffer = yield ReadFile(settingsFile);
    const settings = JSON.parse(settingsBuffer.toString('utf8'));

    const confluenceClient = Confluence.createConfluenceClient(settings);
    const jiraClient = Jira.createJiraClient(settings);
    const xmlClient = Xml.createXmlClient(settings);

    const confluenceData = yield confluenceClient.getConfluenceDataAsync(settings.confluencePage);

    if (confluenceData.data.results.length != 1) {
        throw `Confluence data not found - check if confluence Page title: '${confluencePage}' is correct`;
    }

    const confluenceResponse = confluenceData.data.results[0];
    const itemsToAdd = xmlClient.parseXml(confluenceResponse.body.view.value);

    console.log(`Parsed items for ${settings.confluencePage} and got ${itemsToAdd.map((i) => i.id)}`);

    const jiras = {};

    for (let item of itemsToAdd) {
        const createResponse = yield jiraClient.createJira(item);
        console.log(`Created jira: ${createResponse.data.key}`);

        const linkResponse = yield jiraClient.createRemoteLink(createResponse.data.key);
        console.log(`Created jira - confluence link: ${linkResponse.statusCode}`);

        console.log('Item:', item);
        jiras[item.id] = createResponse.data.key;
    }

    console.log('Requirements and Jira issues: ', jiras);
    console.log('Started Updating confluence page XML with jira links');

    const updatedPage = xmlClient.updateXml(confluenceResponse.body.storage.value, jiras);

    confluenceResponse.body.storage.value = updatedPage;
    delete confluenceResponse.body.view;
    confluenceResponse.version.number = confluenceResponse.version.number + 1;
    confluenceResponse.version.message = 'Updated by Jira-from-Confluence tool';

    console.log('Sending update to confluence');

    return confluenceClient.postConfluenceDataAsync(confluenceResponse.id, JSON.stringify(confluenceResponse));
})
.then((res) => console.log('Operation completed!', (res && res.statusCode) || ''))
.catch((err) => console.error('Operation failed.', err));
