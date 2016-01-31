const bodyParser = require('body-parser');
const byline = require('byline');
const child_process = require('child_process');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs-promise');
const log4js = require('log4js');
const path = require('path');

const spawn = (command, args, options) =>
    new Promise((resolve, reject) => {
        const out = log4js.getLogger(`[${command}]`);

        log4js.getLogger('[spawn]').info(command, args);

        const child = child_process.spawn(command, args, Object.assign({
        }, options));

        child.stdout
            .pipe(byline.createStream())
            .on('data', (line) => {
                out.info(line.toString('utf-8'));
            });

        child.stderr
            .pipe(byline.createStream())
            .on('data', (line) => {
                out.error(line.toString('utf-8'));
            });

        child.stdin.end();

        child.on('error', (error) => reject(error));
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(`${command} exited with code ${code}`);
        });
    });

const app = express();
const logger = log4js.getLogger('[APP]');

app.post('/', (req, res) => {
    const signature = req.get('X-Hub-Signature');
    console.log(signature);

    const event = req.get('X-GitHub-Event');
    console.log(event);

    if (!signature) return res.status(400).end();

    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
        switch (event) {
            case 'push':
                const body = Buffer.concat(chunks).toString('utf-8');
                console.log(body);
        
                const localSignature = crypto.createHmac('sha1', process.env.SECRET).update(body).digest('hex');
                if (signature !== `sha1=${localSignature}`) {
                    console.log(signature, ' does not matched with ', localSignature);
                    return res.status(400).end();
                }
        
                const data = JSON.parse(body);
        
                const gitUrl = data.repository.git_url;
                const name = data.repository.full_name;
                const userDir = path.join('/tmp/nekobuilder', name.split('/')[0]);
                const workDir = path.join('/tmp/nekobuilder', name);
                const gitDir = path.join(workDir, '.git');
                const type = data.ref.split('/')[1];
                const tag = data.ref.split('/')[2];
                const build = log4js.getLogger('[BUILD]');
        
                fs.exists('/tmp/nekobuilder')
                    .then((exists) => exists || fs.mkdir('/tmp/nekobuilder'))
                    .then(() => fs.exists(userDir))
                    .then((exists) => exists || fs.mkdir(userDir))
                    .then(() => fs.exists(gitDir))
                    .then((exists) => exists || spawn('git', ['clone', gitUrl, workDir]))
                    .then(() => spawn('git', ['fetch'], {cwd: workDir}))
                    .then(() => spawn('git', ['checkout', '--force', tag], {cwd: workDir}))
                    .then(() => spawn('git', ['pull', '--rebase'], {cwd: workDir}))
                    .then(() => spawn('git', ['submodule', 'update', '--init', '--recursive', '--force'], {cwd: workDir}))
                    .then(() => spawn('docker', ['build', `--tag=${name}:${tag}`, workDir]))
                    .then(() => tag === 'master' && spawn('docker', 'tag', '-f', `${name}:${tag}`, `${name}:latest`))
                    .then(() => res.send('OK'))
                    .then(() => build.info('OK'))
                    .catch((error) => {
                        build.error(error);
                        res.status(500).end();
                    });
                return;
            default:
                logger.info(event);
                res.status(200).end();
                return;
        }
    });
});

app.listen(8000, () => {
    console.log('Listening');
});
