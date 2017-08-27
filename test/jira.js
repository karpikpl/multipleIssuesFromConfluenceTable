/*jshint esversion: 6, node: true*/
'use strict';
const should = require('chai').should();
const Jira = require('../lib/jira');
const Nock = require('nock');
const co = require('co');

describe('Jira', () => {

    it('should create jira object', () => {

        // act
        const target = Jira.createJiraClient({});

        // assert
        should.exist(target);
    });

    describe('create Jira', () => {

        it('creates new issue in Jira', (done) => {

            co(function*() {

                // arrange
                const settings = {
                    "user": "LOGIN",
                    "pass": "PASSWORD",
                    "host": "someJira.atlassian.net",
                    "port": 443,
                    "epicToLink": 'FR-123'
                };
                const item = {
                    id: 'Req 1',
                    type: 'Configuration',
                    description: 'Something to do'
                };

                const jiraMock = Nock(`https://${settings.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.user}:${settings.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post('/rest/api/2/issue/')
                    .reply(201, {
                        conf: 'issue created'
                    })
                    .log(console.log);
                const target = Jira.createJiraClient(settings);

                // act
                const result = yield target.createJira(item);

                // assert
                jiraMock.isDone().should.be.true;
                result.statusCode.should.be.equal(201);
                result.data.conf.should.be.equal('issue created');
            })
            .then(done)
            .catch(done);
        });

        it('returns an error when could not create issue in Jira', (done) => {

            co(function*() {

                // arrange
                const settings = {
                    "user": "LOGIN",
                    "pass": "PASSWORD",
                    "host": "someJira.atlassian.net",
                    "port": 443,
                    "epicToLink": 'FR-123'
                };
                const item = {
                    id: 'Req 1',
                    type: 'Configuration',
                    description: 'Something to do'
                };

                const jiraMock = Nock(`https://${settings.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.user}:${settings.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post('/rest/api/2/issue/')
                    .reply(500, {
                        conf: 'server error'
                    })
                    .log(console.log);
                const target = Jira.createJiraClient(settings);

                // act
                const result = yield target.createJira(item);
            })
            .then((res) => done('this should not happen - were expecting an error'))
            .catch((err) => {

                // assert
                err.should.match(/500/);
                err.should.match(/server error/);

                done();
            });
        });
    });

    describe('create remote link', () => {

        it('creates remote link in Jira', (done) => {

            co(function*() {

                // arrange
                const settings = {
                    "user": "LOGIN",
                    "pass": "PASSWORD",
                    "host": "someJira.atlassian.net",
                    "port": 443,
                    "epicToLink": 'FR-123',
                    "pageId": 7898765
                };
                const key = 'HA-678';

                const jiraMock = Nock(`https://${settings.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.user}:${settings.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post(`/rest/api/2/issue/${key}/remotelink`)
                    .reply(200, {
                        conf: 'issue updated'
                    })
                    .log(console.log);
                const target = Jira.createJiraClient(settings);

                // act
                const result = yield target.createRemoteLink(key);

                // assert
                jiraMock.isDone().should.be.true;
                result.statusCode.should.be.equal(200);
                result.data.conf.should.be.equal('issue updated');
            })
            .then(done)
            .catch(done);
        });

        it('returns an error when could not create link in Jira', (done) => {

            co(function*() {

                // arrange
                const settings = {
                    "user": "LOGIN",
                    "pass": "PASSWORD",
                    "host": "someJira.atlassian.net",
                    "port": 443,
                    "epicToLink": 'FR-123',
                    "pageId": 7898765
                };
                const key = 'HA-678';

                const jiraMock = Nock(`https://${settings.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.user}:${settings.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .post(`/rest/api/2/issue/${key}/remotelink`)
                    .reply(401, {
                        conf: 'could not create link'
                    })
                    .log(console.log);
                const target = Jira.createJiraClient(settings);

                // act
                const result = yield target.createRemoteLink(key);
            })
            .then((res) => done('this should not happen - were expecting an error'))
            .catch((err) => {

                // assert
                err.should.match(/401/);
                err.should.match(/could not create link/);

                done();
            });
        });
    });
});
