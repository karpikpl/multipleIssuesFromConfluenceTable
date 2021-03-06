/*jshint esversion: 6, node: true*/
'use strict';
const Xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;

function parseXml(data) {

    const doc = new Dom().parseFromString(data);

    const nodes = Xpath.select(`//h2[text()='${this.settings.confluence.tableSection}']//following::table[1]/tbody/tr`, doc);

    console.log(`Found ${nodes.length} requirements by looking for ${`//h2[text()='${this.settings.confluence.tableSection}']//following::table[1]/tbody/tr`}`);

    const results = nodes.map(n => {

        const req = n.getElementsByTagName('td');

        const result = {};

        if (req.length) {
            result.id = aggPharagraphs(req[this.settings.confluence.table_indexes.id]);

            result.title = this.settings.confluence.table_indexes.title
              .map((index) => aggPharagraphs(req[index]))
              .reduce((acc, cur) => acc + ' : ' + cur);

            result.description = this.settings.confluence.table_indexes.description
              .map((index) => aggPharagraphs(req[index], true))
              .reduce((acc, cur) => acc + '\n' + cur);

            if (this.settings.confluence.table_indexes.priority != null) {
                result.priority = aggPharagraphs(req[this.settings.confluence.table_indexes.priority]);
            }

            return result;
        }

    }).filter(n => n);

    return results;
}

function getValue(node) {

    if (node.hasChildNodes()) {

        let nextNode;

        for (let i = 0; i < node.childNodes.length; i++) {

            if (node.childNodes[i].nodeName && node.childNodes[i].tagName) {
                nextNode = node.childNodes[i];
                break;
            }
        }

        return getValue(nextNode || node.firstChild);
    } else {
        return node.nodeValue;
    }
}

function updateXml(data, map) {

    if (this.settings.confluence.table_indexes.jiraId == null) {
        console.warn(`Skipping confluence XML update because 'settings.confluence.table_indexes.jiraId' not provided`);
        return;
    }

    const doc = new Dom().parseFromString(data, 'text/xml');
    //const doc = new Dom().parseFromString(data);

    const nodes = Xpath.select(`//h2[text()='${this.settings.confluence.tableSection}']//following::table[1]/tbody/tr`, doc);

    console.log(`Found ${nodes.length} requirements`);

    nodes.forEach(n => {

        const req = n.getElementsByTagName('td');

        if (req.length) {
            const id = aggPharagraphs(req[this.settings.confluence.table_indexes.id]);

            console.log(`Mapping ${id} to ${map[id]}`);

            const macro = `<ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="39b30d60-4df7-44bc-a639-4427802f1cb0"><ac:parameter ac:name="server">JIRA (${this.settings.atlassian.host})</ac:parameter><ac:parameter ac:name="columns">key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution</ac:parameter><ac:parameter ac:name="serverId">b544e6f4-ac54-35f8-a63d-6d1ebc715244</ac:parameter><ac:parameter ac:name="key">${map[id]}</ac:parameter></ac:structured-macro>`;

            const nodeToInject = new Dom().parseFromString(macro, 'text/xml');
            //const nodeToInject = new Dom().parseFromString(macro);

            req[this.settings.confluence.table_indexes.jiraId].appendChild(nodeToInject);
        }
    });

    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc, true)
      // now remove extra namespaces that serializator added
      .replace(/ ?xmlns:.+?=""/g, '')
      // first remove all extra &amp; that serializator added
      .replace(/&amp;(?!&)(.{1,6}?;)/g, '&$1');

    return xmlString;
}

// add more stuff here to make Jira issues prettier
function aggPharagraphs(node, withNewLine) {

    let content = node.toString();
    content = content.replace(/<\/ul>/gi, withNewLine ? '\n' : ' ');
    content = content.replace(/<li>/gi, '* ');
    // this removed all HTML tags
    content = content.replace(/(<\/?.*?>\s*?)+/gi, withNewLine ? '\n' : ' ');
    content = content.trim();

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
