describe('spawn', () => {
    'use strict';

    jest.mock('child_process');
    const child_process = require('child_process');

    jest.mock('stream');
    const stream = require('stream');

    jest.unmock('../spawn');
    const spawn = require('../spawn');

    let pid = 0;
    const genChild = () => {
        const child = new child_process.ChildProcess();

        child.on.mockClear();

        child.pid = pid++;
        child.stdin = new stream.Writable();
        child.stdout = new stream.Readable();
        child.stderr = new stream.Readable();

        return child;
    };
    const emit = (dispatcher, event, e) => {
        dispatcher
            .on
            .mock
            .calls
            .filter((call) => call[0] === event)
            .forEach((call) => call[1].call(dispatcher, e));
    }

    let child1, promise;
    it('spawns command', () => {
        child1 = genChild();
        child_process.spawn.mockReturnValue(child1);

        promise = spawn('command1', ['arg1', 'arg2'], 'path/to/cwd1');

        expect(child_process.spawn).toBeCalled();

        const call = child_process.spawn.mock.calls[0];
        expect(call[0]).toEqual('command1');
        expect(call[1]).toEqual(['arg1', 'arg2']);
        expect(call[2].cwd).toEqual('path/to/cwd1');
        expect(call[2].stdio).toEqual('pipe');
    });

    pit('resolves when the command succeeded', () => {
        expect(child1.on).toBeCalled();

        emit(child1, 'exit', 0);

        return promise.then(() => {}, (e) => {
            throw new Error(`Promise should not be rejected (${e})`);
        });
    });

    it('closes stdin stream', () => {
        expect(child1.stdin.end).toBeCalled();
    });

    it('pipes stdout/err stream to process.stdout/err', () => {
        expect(child1.stdout.pipe).toBeCalledWith(process.stdout);
        expect(child1.stderr.pipe).toBeCalledWith(process.stderr);
    });

    pit('reject when the command failed', () => {
        const child2 = genChild();
        child_process.spawn.mockReturnValue(child2);

        const p = spawn('command2', [], 'path/to/cwd2');

        emit(child2, 'exit', 2);

        return p.then(() => {
            throw new Error('Promise should not be resolved');
        }, () => {});
    });

    pit('reject when othre error occured', () => {
        child_process.spawn.mockReturnValue({});

        const p = spawn('command3', [], 'path/to/cwd3');

        return p.then(() => {
            throw new Error('Promise should not be resolved');
        }, () => {});
    });
});
