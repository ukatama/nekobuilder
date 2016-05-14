import byline from 'byline';
import {spawn} from 'child_process';
import {getLogger} from 'log4js';
import {Action} from './models/action';
import {Build} from './models/build';
import {Log} from './models/log';
import {Repository} from './models/repository';

const logger = getLogger('[BUILDER]');

const runBuildContainer = (data) =>
    new Promise((resolve, reject) => {
        try {
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '-v', '/usr/bin/docker:/usr/bin/docker:ro',
                '-v', '/var/run/docker.sock:/var/run/docker.sock:ro',
                'ukatama/nekobuilder-builder',
            ], {
                stdio: 'pipe',
            });

            child.on('exit', (code) => {
                if (code) {
                    return reject(`Builder exited with code ${code}`);
                }

                return resolve();
            });

            child.stdin.end(JSON.stringify(data));

            child.stdout
                .pipe(byline.createStream())
                .on('data', (buf) => {
                    const line = buf.toString();

                    Log
                        .create({
                            build_id: data.build.id,
                            error: false,
                            line,
                        })
                        .then(() => logger.info(line))
                        .catch((e) => logger.error(e));
                });
            child.stderr
                .pipe(byline.createStream())
                .on('data', (buf) => {
                    const line = buf.toString();

                    Log
                        .create({
                            build_id: data.build.id,
                            error: true,
                            line,
                        })
                        .then(() => logger.error(line))
                        .catch((e) => logger.error(e));
                });
        } catch (e) {
            reject(e);
        }
    });

/**
 * Build from pushed json
 * @param {Number} id - build id.
 * @return {Promise} Resolved when build done. Rected when failed.
 */
export function build(id) {
    return Build
        .findOne({id})
        .then(({repository_id}) => Promise.all([
            Repository.findOne('id', repository_id),
            Action.find({
                repository_id,
                enabled: true,
            }),
        ]))
        .then(([repository, actions]) =>
            Build
                .update({state: 'building'}, {id})
                .then((build) => ({build, repository, actions}))
        )
        .then(runBuildContainer)
        .then(() =>
            Build.update({state: 'succeeded', ended: Build.fn.now()}, {id})
        )
        .catch((e) => {
            logger.error(e);

            Build.update({state: 'failed', ended: Build.fn.now()}, {id});
        });
}
