'use strict';

const fs = require('fs-promise');
const path = require('path');
const yaml = require('js-yaml');

const spawn = (command, args, cwd, opts) => {
    return new Promise((resolve, reject) => {
        try {
            if (!args) args = [];

            console.log(`$ ${command} ${args.join(' ')}`);

            const child = require('child_process').spawn(command, args, Object.assign({}, {
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

const chunks = [];
process.stdin
    .on('data', (d) => chunks.push(d))
    .on('end', () => {
        try {
            const json = Buffer.concat(chunks).toString();
            const data = JSON.parse(json);
            const build = data.build;
            const repository = data.repository;

            console.log(build);
            console.log(repository);

            const ref = build.ref;
            const id = build.commit_id;

            const clone_url = repository.clone_url;
            const full_name = repository.full_name;

            const image_name = full_name.toLowerCase();
            const tag = ref.split('/')[2];

            const ref_type = ref.split('/')[1];
            const latest = ref_type === 'heads' && (
                tag === 'master' ? 'latest' : `${tag}-latest`
            );

            const travis = 'build/.travis.yml';

            console.log('Build started');

            spawn('git', ['init', 'build'])
                .then(() => spawn('git', ['fetch', clone_url, tag], 'build'))
                .then(() => spawn('git', ['checkout', '--force', id], 'build'))
                .then(() => spawn('git', ['submodule', 'update', '--init', '--recursive'], 'build'))
                .then(() => fs.exists(travis))
                .then((exists) => {
                    if (!exists) return null;
                    console.log('Loading .travis.yml');
                    return fs.readFile(travis);
                })
                .then((data) => data && yaml.safeLoad(data))
                .then((conf) => conf && conf.env || [])
                .then((env) => env.reduce((res, e) => {
                    const m = `${e}`.match(/^(.*?)=(.*)$/);
                    if (m) {
                        res[m[1]] = m[2];
                    }
                    return res;
                }, {}))
                .then((env) => spawn('docker', ['build', '-t', `${image_name}:${tag}`, '.'], 'build', {
                    env: env,
                }))
                .then(() => latest &&
                    spawn('docker', ['tag', '-f', `${image_name}:${tag}`, `${image_name}:${latest}`])
                )
                .then(() => {
                    console.log('Bulid done');
                    process.exit();
                })
                .catch((e) => {
                    consoler.error(e);
                    process.exit(1)
                });
        } catch (e) {
            console.error(e);
            process.exit(2);
        }
    });
