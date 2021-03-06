/* global jest, describe, it, expect, beforeEach, afterEach */
jest.mock('express');
jest.mock('fs-promise');
jest.dontMock('log4js');
jest.dontMock('../app');

describe('app', () => {
    const crypto = require('crypto');
    const express = require('express');
    jest.setMock('log4js', {
        getLogger: jest.fn().mockReturnValue({
            info: jest.fn(),
        }),
    });

    require('../app');

    const {Build} = require('../models/build');

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

        const callback = express.app.listen.mock.calls[0][1];
        if (callback) return callback();
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

        req.on.mockClear();
        res.status.mockClear();

        reqHeaders['X-Hub-Signature'] = 'invalid';
        reqHeaders['X-GitHub-Event'] = 'push';

        handler(req, res, next);
        req.on.mock.calls
            .filter((call) => call[0] === 'end')
            .forEach((call) => call[1]());

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

    pit('respond 200 and start building to push', () => {
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

        Build.fromHook.mockReturnValue(Promise.resolve({}));
        handler(req, res, next);

        req.on.mock.calls.filter((call) => call[0] === 'data')
            .forEach((call) => call[1](new Buffer(data)));
        req.on.mock.calls.filter((call) => call[0] === 'end')
            .forEach((call) => call[1]());

        return Promise.resolve()
            .then(() => {
                expect(Build.fromHook.mock.calls).toEqual([[push]]);
                expect(res.send.mock.calls).toEqual([['Build started.']]);
                expect(next).not.toBeCalled();
            });
    });
});
