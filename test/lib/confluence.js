/*jshint esversion: 6, node: true*/
'use strict';
const should = require('chai').should();
const Confluence = require('../../lib/confluence');
const Nock = require('nock');
const co = require('co');
const testHelper = require('../testHelper');

let conf;

before((done) => {

    conf = testHelper.getSettings();
    done();
});

describe('Confluence', () => {

    it('should create confluence object', () => {

        // act
        const target = Confluence.createConfluenceClient(conf);

        // assert
        should.exist(target);
    });

    describe('get confluence data', () => {

        it('gets data from confluence', (done) => {

            co(function*(settings) {

                // arrange
                const path = 'abc';

                const confluenceMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .get(`/wiki/rest/api/content?spaceKey=${settings.confluence.spaceKey}&title=${path}&expand=body.view,body.storage,version`)
                    .reply(200, {
                        conf: 'some data'
                    })
                    .log(console.log);
                const target = Confluence.createConfluenceClient(settings);

                // act
                const result = yield target.getConfluenceDataAsync(path);

                // assert
                confluenceMock.isDone().should.be.true;
                result.statusCode.should.be.equal(200);
                result.data.conf.should.be.equal('some data');
            }, conf)
            .then(done)
            .catch(done);
        });

        it('returns error when get fails', (done) => {

            co(function*(settings) {

                // arrange
                const path = 'abc';

                const confluenceMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .get(`/wiki/rest/api/content?spaceKey=${settings.confluence.spaceKey}&title=${path}&expand=body.view,body.storage,version`)
                    .reply(409, 'Operation not allowed')
                    .log(console.log);
                const target = Confluence.createConfluenceClient(settings);

                // act
                const result = yield target.getConfluenceDataAsync(path);
            }, conf)
            .then((res) => done('this should not happen - were expecting an error'))
            .catch((err) => {

                // assert
                err.should.match(/409/);
                err.should.match(/Operation not allowed/);

                done();
            });
        });
    });

    describe('Post Confluence data', () => {

        it('posts data to confluence', (done) => {

            co(function*(settings) {

                // arrange
                const id = 123456;
                const data = '<some> confluence data </some>';

                const confluenceMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .put(`/wiki/rest/api/content/${id}`, data)
                    .reply(200, { result: 'ok' })
                    .log(console.log);

                const target = Confluence.createConfluenceClient(settings);

                // act
                const result = yield target.postConfluenceDataAsync(id, data);

                // assert
                confluenceMock.isDone().should.be.true;
                result.statusCode.should.be.equal(200);
                result.data.result.should.equal('ok');
            }, conf)
            .then(done)
            .catch(done);
        });

        it('returns error when post fails', (done) => {

            co(function*(settings) {

                // arrange
                const id = 123456;
                const data = '<some> confluence data </some>';

                const confluenceMock = Nock(`https://${settings.atlassian.host}`, {
                        reqheaders: {
                            'authorization': function (headerValue) {

                                // verify that header was sent correctly
                                const auth = 'Basic ' + new Buffer(`${settings.atlassian.user}:${settings.atlassian.pass}`).toString('base64');
                                return headerValue === auth;
                            }
                        }
                    })
                    .put(`/wiki/rest/api/content/${id}`, data)
                    .reply(409, 'Put failed')
                    .log(console.log);

                const target = Confluence.createConfluenceClient(settings);

                // act
                const result = yield target.postConfluenceDataAsync(id, data);
            }, conf)
            .then((res) => done('this should not happen - were expecting an error'))
            .catch((err) => {

                // assert
                err.should.match(/409/);
                err.should.match(/Put failed/);

                done();
            });
        });
    });
});
