/*jshint esversion: 6, node: true*/
'use strict';
const Chai = require('chai');
const should = Chai.should();
const co = require('co');
const Nock = require('nock');
const ReadFile = require('fs-readfile-promise');
const Path = require('path');

const main = require('../../lib/main');

describe('Min flow integration test', (done) => {

    let settings,
        confluenceMock,
        jiraMock,
        jiraLinkMock,
        confluencePostMock;

    before((done) => {

        co(function* () {

                const settingsBuffer = yield ReadFile(Path.join(__dirname, '../data/settingsForMainTest.json'));
                settings = JSON.parse(settingsBuffer.toString('utf8'));

                const confluenceResponseData = yield ReadFile(Path.join(__dirname, '../data/getConfluenceResponse.json'));
                const confluenceResponse = JSON.parse(confluenceResponseData.toString('utf8'));

                const createJiraRequestData = yield ReadFile(Path.join(__dirname, '../data/createJiraRequest.json'));
                const createJiraRequest = JSON.parse(createJiraRequestData.toString('utf8'));

                const createJiraResponseData = yield ReadFile(Path.join(__dirname, '../data/createJiraResponse.json'));
                const createJiraResponse = JSON.parse(createJiraResponseData.toString('utf8'));

                const createJiraRemoteLinkRequestData = yield ReadFile(Path.join(__dirname, '../data/createJiraRemoteLinkRequest.json'));
                const createJiraRemoteLinkRequest = JSON.parse(createJiraRemoteLinkRequestData.toString('utf8'));

                const createJiraRemoteLinkResponseData = yield ReadFile(Path.join(__dirname, '../data/createJiraRemoteLinkResponse.json'));
                const createJiraRemoteLinkResponse = JSON.parse(createJiraRemoteLinkResponseData.toString('utf8'));

                const updateConfluenceRequestData = yield ReadFile(Path.join(__dirname, '../data/updateConfluenceRequest.json'));
                const updateConfluenceRequest = JSON.parse(updateConfluenceRequestData.toString('utf8'));

                confluenceMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .get(`/wiki/rest/api/content?spaceKey=${settings.confluence.spaceKey}&title=${settings.confluence.confluencePage}&expand=body.view,body.storage,version`)
                    .reply(200, confluenceResponse)
                    .log(console.log);

                jiraMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post('/rest/api/2/issue/', createJiraRequest)
                    .reply(201, createJiraResponse)
                    .log(console.log);

                jiraLinkMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post(`/rest/api/2/issue/JIRA-11010/remotelink`, createJiraRemoteLinkRequest)
                    .reply(201, createJiraRemoteLinkResponse)
                    .log(console.log);

                confluencePostMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .put(`/wiki/rest/api/content/1234567`, updateConfluenceRequest)
                    .reply(200, {
                        result: 'ok'
                    })
                    .log(console.log);
            })
            .then(() => done())
            .catch(done);
    });

    it('should read confluence page, create jira issues and update confluence with result', (done) => {

        co(function* () {

                // arrange

                // act
                const result = yield main.createJirasUpdateConfluence(settings);

                // assert
                result.should.match(/Updated confluence/);
                result.should.match(/with status code 200/);
            })
            .then(() => done())
            .catch((err) => done(err));
    });
});
