/*jshint esversion: 6, node: true*/
'use strict';
const should = require('chai')
    .should();
const Jira = require('../../lib/jira');
const Nock = require('nock');
const testHelper = require('../testHelper');

let conf;

before((done) => {

    conf = testHelper.getSettings();
    done();
});

describe('Jira', () => {

    it('should create jira object', () => {

        // act
        const target = Jira.createJiraClient(conf);

        // assert
        should.exist(target);
    });

    describe('create Jira', () => {

        it('creates new issue in Jira', async () => {

            // arrange
            const item = {
                id: 'Req 1',
                type: 'Configuration',
                description: 'Something to do'
            };

            const jiraMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .post('/rest/api/2/issue/')
                .reply(201, {
                    conf: 'issue created'
                })
                .log(console.log);
            const target = Jira.createJiraClient(conf);

            // act
            const result = await target.createJira(item);

            // assert
            jiraMock.isDone()
                .should.be.true;
            result.statusCode.should.be.equal(201);
            result.data.conf.should.be.equal('issue created');
        });

        it('returns an error when could not create issue in Jira', async () => {

            // arrange
            const item = {
                id: 'Req 1',
                type: 'Configuration',
                description: 'Something to do'
            };

            const jiraMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .post('/rest/api/2/issue/')
                .reply(500, {
                    conf: 'server error'
                })
                .log(console.log);
            const target = Jira.createJiraClient(conf);

            // act
            await target.createJira(item)
                .then((res) => done('this should not happen  were expecting an error'))
                .catch((err) => {

                    // assert
                    err.should.match(/500/);
                    err.should.match(/server error/);
                });
        });
    });

    describe('create remote link', () => {

        it('creates remote link in Jira', async () => {

            // arrange
            const key = 'HA678';

            const jiraMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .post(`/rest/api/2/issue/${key}/remotelink`)
                .reply(200, {
                    conf: 'issue updated'
                })
                .log(console.log);
            const target = Jira.createJiraClient(conf);

            // act
            const result = await target.createRemoteLink(key);

            // assert
            jiraMock.isDone()
                .should.be.true;
            result.statusCode.should.be.equal(200);
            result.data.conf.should.be.equal('issue updated');
        });

        it('returns an error when could not create link in Jira', async () => {

            // arrange
            const key = 'HA678';

            const jiraMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .post(`/rest/api/2/issue/${key}/remotelink`)
                .reply(401, {
                    conf: 'could not create link'
                })
                .log(console.log);
            const target = Jira.createJiraClient(conf);

            // act
            await target.createRemoteLink(key)
                .then((res) => done('this should not happen  were expecting an error'))
                .catch((err) => {

                    // assert
                    err.should.match(/401/);
                    err.should.match(/could not create link/);
                });
        });
    });

    describe('create Jira Payload', () => {

        it('Creates valid Jira Payload', () => {

            // arrange
            const target = Jira.createJiraClient(conf);
            const expected = {
                "fields": {
                    "assignee": {
                        "name": "SGuy"
                    },
                    "customfield_10008": "FR-2130",
                    "description": "Some description",
                    "fixVersions": [{
                        "id": "17502"
          }],
                    "issuetype": {
                        "name": "Configuration"
                    },
                    "priority": {
                        "name": "Highest"
                    },
                    "project": {
                        "key": "FR"
                    },
                    "summary": "Req123 : My title",
                    "customfield_TO_STORE_ID": "Req123"
                }
            };
            const item = {
                id: 'Req123',
                title: 'Req123 : My title',
                description: 'Some description',
                priority: '1. Critical'
            };

            // act
            const result = target.createJiraPayload(item, conf);

            // assert
            result.should.deep.equal(expected);
        });

        it('Creates valid Jira Payload for Epics', () => {

            // arrange
            const conf = {
                "jira": {
                    "issueType_name": "Epic",
                    "project_key": "FR",
                    "confluence_appId": "49bb368d-6cf7-3bd5-ab1d-6a21b0606b02"
                }
            };
            const target = Jira.createJiraClient(conf);
            const expected = {
                "fields": {
                    "description": "Some description",
                    "issuetype": {
                        "name": "Epic"
                    },
                    "customfield_10009": "Req123",
                    "project": {
                        "key": "FR"
                    },
                    "summary": "Req123 : My title"
                }
            };
            const item = {
                id: 'Req123',
                title: 'Req123 : My title',
                description: 'Some description'
            };

            // act
            const result = target.createJiraPayload(item, conf);

            // assert
            result.should.deep.equal(expected);
        });
    });
});
