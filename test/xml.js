/*jshint esversion: 6, node: true*/
'use strict';
const Chai = require('chai');
const should = Chai.should();
const Xml = require('../lib/xml');
const Dom = require('xmldom').DOMParser;

const sampleXml = `<p class="auto-cursor-target">some text 2</p><h2>Requirements</h2><table class="wrapped confluenceTable"><colgroup><col /><col /><col /><col /><col /><col /><col /><col /></colgroup><thead><tr><th class="numberingColumn confluenceTh">#</th><th class="confluenceTh">ID</th><th class="confluenceTh">Function</th><th class="confluenceTh">Description</th><th class="confluenceTh">High level Summary</th><th class="confluenceTh">Rationale</th><th class="confluenceTh">Impacted User</th><th class="confluenceTh">JIRA Id</th></tr></thead><tbody><tr><td class="numberingColumn confluenceTd">1</td><td class="confluenceTd"><p>AR_Req_001</p></td><td class="confluenceTd"><p>Initial Medical Underwriting by AURA</p></td><td class="confluenceTd"><p>def</p></td><td colspan="1" class="confluenceTd"><br /></td><td class="confluenceTd"><p>Medical underwriting execution on the front-end</p></td><td class="confluenceTd"><p>Agent</p></td><td colspan="1" class="confluenceTd"><img class="editor-inline-macro" src="/wiki/plugins/servlet/confluence/placeholder/macro?definition=e2ppcmE6a2V5PUZSLTE5MjF9&amp;locale=en_GB" data-macro-name="jira" data-macro-id="532e95b2-8430-48e4-a36d-18204e1ae232" data-macro-parameters="columns=key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution|key=FR-1921|server=JIRA (someJira.atlassian.net)|serverId=b544e6f4-ac54-35f8-a63d-6d1ebc715244" data-macro-schema-version="1"></td></tr><tr><td class="numberingColumn confluenceTd">2</td><td class="confluenceTd"><p>AR_Req_002</p></td><td class="confluenceTd"><p>Generation of automated medical underwriting result</p></td><td class="confluenceTd"><p>abc</p></td><td colspan="1" class="confluenceTd"><br /></td><td class="confluenceTd"><p>Underwriting result execution on the front-end</p></td><td class="confluenceTd"><p>Agent</p></td><td colspan="1" class="confluenceTd"><img class="editor-inline-macro" src="/wiki/plugins/servlet/confluence/placeholder/macro?definition=e2ppcmE6a2V5PUZSLTE5MjF9&amp;locale=en_GB" data-macro-name="jira" data-macro-id="d0ecbe2f-b09d-42de-ae7b-357ae7054fe0" data-macro-parameters="columns=key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution|key=FR-1921|server=JIRA (someJira.atlassian.net)|serverId=b544e6f4-ac54-35f8-a63d-6d1ebc715244" data-macro-schema-version="1"></td></tr></tbody></table><p class="auto-cursor-target"><br /></p>`;

describe('Xml', () => {

    it('should create jira object', () => {

        // act
        const target = Xml.createXmlClient({});

        // assert
        should.exist(target);
    });

    it('parses xml and returns data from the table', () => {

        // arrange
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const expected = [{
                id: 'AR_Req_001',
                type: 'Initial Medical Underwriting by AURA',
                description: 'def'
            },
            {
                id: 'AR_Req_002',
                type: 'Generation of automated medical underwriting result',
                description: 'abc'
            }];
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.parseXml(sampleXml);

        // assert
        data.should.deep.equal(expected);
    });

    it('updates xml with macro data', () => {

        // arrange
        const sampleXmlForUpdate = '<h2>Requirements</h2><table class="wrapped"><thead><tr><th class="numberingColumn">#</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr></thead><tbody><tr><td class="numberingColumn">1</td><td><p>AR_Req_001</p></td><td><p>InitialMedicalUnderwritingbyAURA</p></td><td><p>def</p></td><td colspan="1"><br/></td><td><p>Medicalunderwritingexecutiononthefront-end</p></td><td><p>Agent</p></td><td colspan="1"></td></tr></tbody></table>';
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const map = {
            AR_Req_001: 'HA-1',
            AR_Req_002: 'DR-2'
        }
        const expected = '<h2>Requirements</h2><table class=\"wrapped\"><thead><tr><th class=\"numberingColumn\">#</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr></thead><tbody><tr><td class=\"numberingColumn\">1</td><td><p>AR_Req_001</p></td><td><p>InitialMedicalUnderwritingbyAURA</p></td><td><p>def</p></td><td colspan=\"1\"><br/></td><td><p>Medicalunderwritingexecutiononthefront-end</p></td><td><p>Agent</p></td><td colspan=\"1\"><ac:structured-macro ac:name=\"jira\" ac:schema-version=\"1\" ac:macro-id=\"39b30d60-4df7-44bc-a639-4427802f1cb0\"><ac:parameter ac:name=\"server\">JIRA (someJira.atlassian.net)</ac:parameter><ac:parameter ac:name=\"columns\">key,summary,type,created,updated,due,assignee,reporter,priority,status,resolution</ac:parameter><ac:parameter ac:name=\"serverId\">b544e6f4-ac54-35f8-a63d-6d1ebc715244</ac:parameter><ac:parameter ac:name=\"key\">HA-1</ac:parameter></ac:structured-macro></td></tr></tbody></table>';
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.updateXml(sampleXmlForUpdate, map);

        // assert
        data.should.equal(expected);
    })

    it('updates simple xml with macro data', () => {

        // arrange
        const sampleXmlForUpdate = `<h2>Requirements</h2><p class="something">a</p>`;
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const map = {};
        const expected = `<h2>Requirements</h2><p class=\"something\">a</p>`;
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.updateXml(sampleXmlForUpdate, map);

        // assert
        data.should.equal(expected);
    });

    it('updates simple xml with &', () => {

        // arrange
        const sampleXmlForUpdate = `<p class="auto-cursor-target"><br/></p><h2>User interaction and design from C&amp;A</h2><p><ac:placeholder >Include any mockups, diagrams or visual designs relating to these requirements.</ac:placeholder></p>`;
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const map = {};
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.updateXml(sampleXmlForUpdate, map);

        // assert
        data.should.equal(sampleXmlForUpdate, 'Should not change');
    });

    it('updates simple xml with &rsquo;', () => {

        // arrange
        const sampleXmlForUpdate = `<h2>ly with the policyholder&rsquo;s and guardian&rsquo;s ide</h2>`;
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const map = {};
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.updateXml(sampleXmlForUpdate, map);

        // assert
        data.should.equal(sampleXmlForUpdate, 'should not change');
    });

    it.skip('updates simple xml with special characters', () => {

        // arrange
        const sampleXmlForUpdate = `<p class="auto-cursor-target"><br /></p><table><tbody><tr><th style="text-align: left;">Result</th><th style="text-align: left;">Description</th><th style="text-align: left;">Entity Name</th><th style="text-align: left;">Entity Number</th></tr><tr><td><br /></td><td>non-breaking space</td><td>&amp;nbsp;</td><td>&amp;#160;</td></tr><tr><td>&lt;</td><td>less than</td><td>&amp;lt;</td><td>&amp;#60;</td></tr><tr><td>&gt;</td><td>greater than</td><td>&amp;gt;</td><td>&amp;#62;</td></tr><tr><td>&amp;</td><td>ampersand</td><td>&amp;amp;</td><td>&amp;#38;</td></tr><tr><td>&quot;</td><td>double quotation mark</td><td>&amp;quot;</td><td>&amp;#34;</td></tr><tr><td>'</td><td>single quotation mark (apostrophe)</td><td>&amp;apos;</td><td>&amp;#39;</td></tr><tr><td>&cent;</td><td>cent</td><td>&amp;cent;</td><td>&amp;#162;</td></tr><tr><td>&pound;</td><td>pound</td><td>&amp;pound;</td><td>&amp;#163;</td></tr><tr><td>&yen;</td><td>yen</td><td>&amp;yen;</td><td>&amp;#165;</td></tr><tr><td>&euro;</td><td>euro</td><td>&amp;euro;</td><td>&amp;#8364;</td></tr><tr><td>&copy;</td><td>copyright</td><td>&amp;copy;</td><td>&amp;#169;</td></tr><tr><td>&reg;</td><td>registered trademark</td><td>&amp;reg;</td><td>&amp;#174;</td></tr></tbody></table><p class="auto-cursor-target"><br /></p>`;
        const settings = {
            tableSection: 'Requirements',
            convertHtmlToJiraMarkup: true,
            host: 'someJira.atlassian.net'
        };
        const map = {};
        const target = Xml.createXmlClient(settings);

        // act
        const data = target.updateXml(sampleXmlForUpdate, map);

        // assert
        data.should.equal(sampleXmlForUpdate, 'Should not change');
    });

    it('gets node value', () => {

        // arrange
        const doc = new Dom().parseFromString(`<td><p>AR_Req_001</p></td>`);
        const target = Xml.createXmlClient();

        // act
        const data = target.getValue(doc.documentElement);

        // assert
        data.should.equal('AR_Req_001');
    });

    it('gets node value - with attributes', () => {

        // arrange
        const doc = new Dom().parseFromString(`'<td class="confluenceTd">        <p>AR_Req_002</p>      </td>'`);
        const target = Xml.createXmlClient();

        // act
        const data = target.getValue(doc.documentElement);

        // assert
        data.should.equal('AR_Req_002');
    });
});
