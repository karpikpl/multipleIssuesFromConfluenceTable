/*jshint esversion: 6, node: true*/
'use strict';
const Confluence = require('./confluence');
const Jira = require('./jira');
const Xml = require('./xml');

const createJirasUpdateConfluence = async function (settings) {

    const confluenceClient = Confluence.createConfluenceClient(settings);
    const jiraClient = Jira.createJiraClient(settings);
    const xmlClient = Xml.createXmlClient(settings);

    const confluenceData = await confluenceClient.getConfluenceDataAsync(settings.confluence.confluencePage);

    if (confluenceData.data.results.length != 1) {
        throw `Confluence data not found - check if confluence Page title: '${confluencePage}' is correct`;
    }

    const confluenceResponse = confluenceData.data.results[0];
    const itemsToAdd = xmlClient.parseXml(confluenceResponse.body.view.value);

    if (!itemsToAdd.length) {
        return console.warn('Did not find any jira items to create. Make sure xpath expression is correct and it matches page being parsed.');
    }

    console.log(`Parsed items for ${settings.confluence.confluencePage} and got ${itemsToAdd.map((i) => i.id)}`);

    const jiras = {};

    const jiraKeysPromise = itemsToAdd.map(async (item) => {
        const createResponse = await jiraClient.createJira(item);
        console.log(`Created jira: ${createResponse.data.key}`);

        const linkResponse = await jiraClient.createRemoteLink(createResponse.data.key);
        console.log(`Created jira - confluence link: ${linkResponse.statusCode}`);

        console.log('Item:', item);
        jiras[item.id] = createResponse.data.key;
        return createResponse.data.key;
    });

    await Promise.all(jiraKeysPromise);

    console.log('Requirements and Jira issues: ', jiras);

    if (!settings.confluence.updateConfluence) {
        return `Created ${jiras.length} item in Jira, skipping Confluence update because 'settings.confluence.updateConfluence' is not true`;
    }

    console.log('Started Updating confluence page XML with jira links');

    const updatedPage = xmlClient.updateXml(confluenceResponse.body.storage.value, jiras);

    confluenceResponse.body.storage.value = updatedPage;
    delete confluenceResponse.body.view;
    confluenceResponse.version.number = confluenceResponse.version.number + 1;
    confluenceResponse.version.message = 'Updated by Jira-from-Confluence tool';

    console.log('Sending update to confluence');
    return confluenceClient.postConfluenceDataAsync(confluenceResponse.id, JSON.stringify(confluenceResponse));
}

exports.createJirasUpdateConfluence = createJirasUpdateConfluence;
