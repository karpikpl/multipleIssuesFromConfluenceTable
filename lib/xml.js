/*jshint esversion: 6, node: true*/
'use strict';
const Xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;

function parseXml(data) {

    const doc = new Dom().parseFromString(data);

    const nodes = Xpath.select(`//h2[text()='${this.settings.tableSection}']//following::table[1]/tbody/tr`, doc);

    console.log(`Found ${nodes.length} requirements by looking for ${`//h2[text()='${this.settings.tableSection}']//following::table[1]/tbody/tr`}`);

    const results = nodes.map(n => {

        const req = n.getElementsByTagName('td');

        const result = {};

        if (req.length) {
            result.id = aggPharagraphs(req[1]);
            result.type = aggPharagraphs(req[2]);
            result.description = aggPharagraphs(req[3], true);

            return result;
        }

    }).filter(n => n);

    return results;
}

function getValue(node) {

    if (node.hasChildNodes() && node.childNodes.length === 1) {
        return getValue(node.firstChild);
    } else {
        return node.nodeValue;
    }
}

function updateXml(data, map) {
    const doc = new Dom().parseFromString(data);

    const nodes = Xpath.select(`//h2[text()='${this.settings.tableSection}']//following::table[1]/tbody/tr`, doc);

    console.log(`Found ${nodes.length} requirements`);

    nodes.forEach(n => {

        const req = n.getElementsByTagName('td');

        if (req.length) {
            const id = getValue(req[1]);

            console.log(`Mapping ${id} to ${map[id]}`);

            const macro = '<ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="39b30d60-4df7-44bc-a639-4427802f1cb0"><ac:parameter ac:name="server">JIRA (ensemble.atlassian.net)</ac:parameter><ac:parameter ac:name="columns">key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution</ac:parameter><ac:parameter ac:name="serverId">b544e6f4-ac54-35f8-a63d-6d1ebc715244</ac:parameter><ac:parameter ac:name="key">$JIRA-KEY</ac:parameter></ac:structured-macro>'.replace('$JIRA-KEY', map[id]);
            const nodeToInject = new Dom().parseFromString(macro);

            req[7].appendChild(nodeToInject);
        }

    });

    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);

    return xmlString.replace(/xmlns:ac="" /g, '').replace(/"/g, '\\"').replace(/\n/g, '');
}

function aggPharagraphs(node, withNewLine, convertHtmlToJiraMarkup) {

    let content = node.toString();

    if (convertHtmlToJiraMarkup) {
        content = content.replace(/<\/ul>/gi, withNewLine ? '\n' : ' ');
        content = content.replace(/<li>/gi, '* ');
        content = content.replace(/(<\/?.*?>\s*?)+/gi, withNewLine ? '\n' : ' ');

        content = content.trim();
    }

    return content;
}

function createXmlClient(settings) {

    return {
        parseXml,
        updateXml,
        getValue,
        settings
    };
}

exports.createXmlClient = createXmlClient;
