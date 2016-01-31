/* global jest, describe, it, expect, beforeEach */
jest.mock('child_process');
jest.dontMock('byline');
jest.dontMock('log4js');
jest.dontMock('../lib/spawn');

const genMockStream = () => ({
    pipe: jest.genMockFunction()
        .mockImpl((s) => s),
    end: jest.genMockFunction(),
    on: jest.genMockFunction(),
});

describe('spawn', () => {
    'use strict';

    const child_process = require('child_process');
    const createPromise = require('../lib/util').createPromise;
    const spawn = require('../lib/spawn');

    let childProcess;
    let resolve, reject;
    beforeEach(() => {
        childProcess = Object.assign({
            stdin: genMockStream(),
            stdout: genMockStream(),
            stderr: genMockStream(),
        }, genMockStream());
        child_process.spawn.mockReturnValue(childProcess);

        resolve = jest.genMockFunction();
        reject = jest.genMockFunction();

        spawn('cmd', ['arg1', 'arg2'], {cwd: 'cwd'})
        createPromise.mock.calls[0][0](resolve, reject);
    });

    it('spawns child process', () => {
        expect(child_process.spawn).toBeCalledWith('cmd', ['arg1', 'arg2'], {cwd: 'cwd'});

        childProcess.on.mock.calls.filter((call) => call[0] === 'close')
            .forEach((call) => call[1](0));

        expect(resolve).toBeCalled();
        expect(reject).not.toBeCalled();
    });

    it('rejects on error', () => {
        let error = new Error('Fake Error');

        childProcess.on.mock.calls.filter((call) => call[0] === 'error')
            .forEach((call) => call[1](error));

        expect(resolve).not.toBeCalled();
        expect(reject).toBeCalledWith(error);
    });

    it('rejects on non-zero return code', () => {
        childProcess.on.mock.calls.filter((call) => call[0] === 'close')
            .forEach((call) => call[1](1));

        expect(resolve).not.toBeCalled();
        expect(reject).toBeCalled();
    });
});