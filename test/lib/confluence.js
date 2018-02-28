/*jshint esversion: 6, node: true*/
'use strict';
const should = require('chai')
    .should();
const Confluence = require('../../lib/confluence');
const Nock = require('nock');
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

        it('gets data from confluence', async () => {

            // arrange
            const path = 'abc';

            const confluenceMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .get(`/wiki/rest/api/content?spaceKey=${conf.confluence.spaceKey}&title=${path}&expand=body.view,body.storage,version`)
                .reply(200, {
                    conf: 'some data'
                })
                .log(console.log);
            const target = Confluence.createConfluenceClient(conf);

            // act
            const result = await target.getConfluenceDataAsync(path);

            // assert
            confluenceMock.isDone()
                .should.be.true;
            result.statusCode.should.be.equal(200);
            result.data.conf.should.be.equal('some data');
        });

        it('returns error when get fails', async () => {

            // arrange
            const path = 'abc';

            const confluenceMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .get(`/wiki/rest/api/content?spaceKey=${conf.confluence.spaceKey}&title=${path}&expand=body.view,body.storage,version`)
                .reply(409, 'Operation not allowed')
                .log(console.log);
            const target = Confluence.createConfluenceClient(conf);

            // act
            await target.getConfluenceDataAsync(path)
                .then((res) => done('this should not happen - were expecting an error'))
                .catch((err) => {

                    // assert
                    err.should.match(/409/);
                    err.should.match(/Operation not allowed/);
                });
        });
    });

    describe('Post Confluence data', () => {

        it('posts data to confluence', async () => {

            // arrange
            const id = 123456;
            const data = '<some> confluence data </some>';

            const confluenceMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .put(`/wiki/rest/api/content/${id}`, data)
                .reply(200, {
                    result: 'ok'
                })
                .log(console.log);

            const target = Confluence.createConfluenceClient(conf);

            // act
            const result = await target.postConfluenceDataAsync(id, data);

            // assert
            confluenceMock.isDone()
                .should.be.true;
            result.should.match(/200/);
        });

        it('returns error when post fails', async () => {

            // arrange
            const id = 123456;
            const data = '<some> confluence data </some>';

            const confluenceMock = Nock(`https://${conf.atlassian.host}`, {
                    reqheaders: {
                        'authorization': function (headerValue) {

                            // verify that header was sent correctly
                            const auth = 'Basic ' + new Buffer(`${conf.atlassian.user}:${conf.atlassian.pass}`)
                                .toString('base64');
                            return headerValue === auth;
                        }
                    }
                })
                .put(`/wiki/rest/api/content/${id}`, data)
                .reply(409, 'Put failed')
                .log(console.log);

            const target = Confluence.createConfluenceClient(conf);

            // act
            await target.postConfluenceDataAsync(id, data)
                .then((res) => done('this should not happen - were expecting an error'))
                .catch((err) => {

                    // assert
                    err.should.match(/409/);
                    err.should.match(/Put failed/);
                });
        });
    });
});
