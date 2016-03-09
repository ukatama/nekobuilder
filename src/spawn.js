'use strict';

const child_process = require('child_process');

const spawn = (command, args, cwd, opts) => {
    return new Promise((resolve, reject) => {
        try {
            if (!args) args = [];

            console.log(`$ ${command} ${args.join(' ')}`);

            const child = child_process.spawn(command, args, Object.assign({}, {
                cwd,
                stdio: 'pipe',
            }, opts));

            child.on('exit', (code) => {
                if (code) {
                    console.error(`${command}:${child.pid} exitied with ${code}`);
                    return reject(code);
                }
                console.log(`${command}:${child.pid} exitied with ${code}`);
                return resolve();
            });

            child.stdin.end();

            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        } catch (e) {
            reject(e);
        }
    });
};
module.exports = spawn;
