'use strict';

const fs = require('fs-promise');
const log4js = require('log4js');
const path = require('path');
const spawn = require('./spawn');

const logger = log4js.getLogger('[BUILDER]');

const tasks = [];
let working = false;
const runBuilder = () => {
    if (!working && tasks.length > 0) {
        working = true;

        const push = tasks.pop();

        const gitUrl = push.repository.git_url;
        const name = push.repository.full_name;
        const tagName = name.toLowerCase();
        const userDir = path.join('/tmp/nekobuilder', name.split('/')[0]);
        const workDir = path.join('/tmp/nekobuilder', name);
        const gitDir = path.join(workDir, '.git');
        const type = push.ref.split('/')[1];
        const tag = push.ref.split('/')[2];
        const build = log4js.getLogger('[BUILD]');
        logger.info('start building', name);

        fs.exists('/tmp/nekobuilder')
            .then((exists) => exists || fs.mkdir('/tmp/nekobuilder'))
            .then(() => fs.exists(userDir))
            .then((exists) => exists || fs.mkdir(userDir))
            .then(() => fs.exists(gitDir))
            .then((exists) => exists || spawn('git', ['clone', gitUrl, workDir]))
            .then(() => spawn('git', ['fetch'], {cwd: workDir}))
            .then(() => spawn('git', ['checkout', '--force', tag], {cwd: workDir}))
            .then(() => type === 'heads' &&
                spawn('git', ['pull', '--rebase'], {cwd: workDir})
                    .catch(() => spawn('rm', ['-rf', workDir])
                        .then(() => spawn('git', ['clone', gitUrl, workDir]))
                    )
            )
            .then(() => spawn('git', ['submodule', 'update', '--init', '--recursive', '--force'], {cwd: workDir}))
            .then(() => spawn('docker', ['build', `--tag=${tagName}:${tag}`, workDir]))
            .then(() => tag === 'master' && spawn('docker', ['tag', '-f', `${tagName}:${tag}`, `${tagName}:latest`]))
            .then(() => build.info('OK'))
            .catch((error) => build.error(error))
            .then(() => {
                working = false;
                setTimeout(runBuilder);
            });
    }
};

module.exports = {
    build: (push) => {
        tasks.push(push);
        logger.info('queued', push.repository.full_name);
        setTimeout(runBuilder);
    },
};