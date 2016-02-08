'use strict';

const byline = require('byline');
const getLogger = require('log4js').getLogger;

const spawnLogger = getLogger(`[spawn]`);
const spawn = (command, args, cwd) => {
    return new Promise((resolve, reject) => {
        try {
            if (!args) args = [];

            spawnLogger.info(`$ ${command} ${args.join(' ')}`);

            const child = require('child_process').spawn(command, args, {
                cwd,
                stdio: 'pipe',
            });

            const childLogger = getLogger(`[spawn:${command}:${child.pid}]`);

            child.on('exit', (code) => {
                if (code) {
                    spawnLogger.error(`${command}:${child.pid} exitied with ${code}`);
                    return reject(code);
                }
                spawnLogger.info(`${command}:${child.pid} exitied with ${code}`);
                return resolve();
            });

            child.stdin.end();

            child.stdout.pipe(byline.createStream())
                .on('data', (d) => childLogger.info(d.toString()));
            child.stderr.pipe(byline.createStream())
                .on('data', (d) => childLogger.error(d.toString()));
        } catch (e) {
            reject(e);
        }
    });
};

const chunks = [];
process.stdin
    .on('data', (d) => chunks.push(d))
    .on('end', () => {
        const json = Buffer.concat(chunks).toString();
        const data = JSON.parse(json);

        const logger = getLogger('[DEFAULT]');

        const ref = data.ref;
        const head_commit = data.head_commit;
        const id = head_commit.id;

        const repository = data.repository;
        const clone_url = repository.clone_url;
        const full_name = repository.full_name;

        const image_name = full_name.toLowerCase();
        const tag = ref.split('/')[2];

        const ref_type = ref.split('/')[1];
        const latest = ref_type === 'heads' && (
            tag === 'master' ? 'latest' : `${tag}-latest`
        );

        logger.info('Build started');

        spawn('git', ['init', 'build'])
            .then(() => spawn('git', ['fetch', clone_url], 'build'))
            .then(() => spawn('git', ['checkout', '--force', id], 'build'))
            .then(() => spawn('git', ['submodule', 'update', '--init', '--recursive'], 'build'))
            .then(() => spawn('docker', ['build', '-t', `${image_name}:${tag}`, 'build']))
            .then(() => latest &&
                spawn('docker', ['tag', '-f', `${image_name}:${tag}`, `${image_name}:${latest}`])
            )
            .then(() => {
                logger.info('Bulid done');
                process.exit();
            })
            .catch((e) => {
                logger.error(e);
                process.exit(1)
            });
    });
