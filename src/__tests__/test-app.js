/* global jest, describe, it, expect, beforeEach, afterEach */
jest.mock('express');
jest.mock('fs-promise');
jest.dontMock('log4js');
jest.dontMock('../app');

describe('app', () => {
    const crypto = require('crypto');
    const express = require('express');
    const app = require('../app');
    const task = require('../task');

    const reqHeaders = {
        'X-Hub-Signature': null,
        'X-GitHub-Event': null,
    };

    let prevEnv,
        req, res, next,
        handler;
    const secret = 'THE SECRET FOR TEST';
    beforeEach(() => {
        prevEnv = process.env;
        process.env = Object.assign({}, process.env, {
            SECRET: secret,
        });

        req = {
            get: jest.genMockFunction()
                .mockImpl((key) => reqHeaders[key]),
            on: jest.genMockFunction(),
        };
        res = {
            send: jest.genMockFunction(),
            status: jest.genMockFunction().mockReturnThis(),
            end: jest.genMockFunction(),
        };
        next = jest.genMockFunction();

        handler =
            express.app.post.mock.calls.find((call) => call[0] === '/hook')[1];
    });
    afterEach(() => {
        process.env= prevEnv;
    });

    it('listens port 80', () => {
        expect(express.app.listen).toBeCalled();
        expect(express.app.listen.mock.calls[0][0]).toBe(80);
    });

    it('handles POST /hook', () => {
        handler(req, res, next);

        expect(res.end).toBeCalled();
        expect(next).not.toBeCalled();
    });

    it('respond 400 to bad signature', () => {
        handler(req, res, next);

        expect(res.status).toBeCalledWith(400);
        expect(next).not.toBeCalled();
    });

    it('respond 200 to ping', () => {
        const data = '{ "key": "value" }';
        reqHeaders['X-Hub-Signature'] =
            `sha1=${crypto.createHmac('sha1', secret).update(data).digest('hex')}`;
        reqHeaders['X-GitHub-Event'] = 'ping';

        handler(req, res, next);
        req.on.mock.calls.filter((call) => call[0] === 'end')
            .forEach((call) => call[1]());

        expect(res.status).toBeCalledWith(200);
        expect(res.end).toBeCalled();
        expect(next).not.toBeCalled();
    });

    it('respond 200 and start building to push', () => {
        const push = {
            repository: {
                git_url: 'git_url',
                fill_name: 'full_name',
            },
        };
        const data = JSON.stringify(push);
        reqHeaders['X-Hub-Signature'] =
            `sha1=${crypto.createHmac('sha1', secret).update(data).digest('hex')}`;
        reqHeaders['X-GitHub-Event'] = 'push';

        handler(req, res, next);
        req.on.mock.calls.filter((call) => call[0] === 'data')
            .forEach((call) => call[1](new Buffer(data)));
        req.on.mock.calls.filter((call) => call[0] === 'end')
            .forEach((call) => call[1]());

        expect(res.send).toBeCalled();
        expect(next).not.toBeCalled();
        expect(task.pushTask).toBeCalledWith(push);
    });
});
