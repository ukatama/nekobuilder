import byline from 'byline';
import { spawn } from 'child_process';
import { database } from './database';

const runBuildContainer = (data) =>
    new Promise((resolve, reject) => {
        try {
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '-v', '/usr/bin/docker:/usr/bin/docker:ro',
                '-v', '/var/run/docker.sock:/var/run/docker.sock:ro',
                'ukatama/nekobuilder-builder:feature-db',
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
                .on('data', (line) => {
                    database('logs').insert({
                        build_id: data.build.id,
                        error: false,
                        line,
                    });
                });
            child.stderr
                .pipe(byline.createStream())
                .on('data', (line) => {
                    database('logs').insert({
                        build_id: data.build.id,
                        error: true,
                        line,
                    });
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
    return database('builds')
        .where('id', id)
        .first()
        .then((build) => !build
            ? Promise.reject(new Error('Build not found'))
            : database('repositories')
                .where('id', build.repository_id)
                .first()
                .then((repository) => !repository
                    ? Promise.reject(
                        new Error('Repository not found')
                    )
                    : database('builds').where({ id }).update({
                        state: 'building',
                    }).then(() => runBuildContainer({
                        build,
                        repository,
                    }))
                )
        )
        .then(() => database('builds').where({ id }).update({
            state: 'succeeded',
            ended: database.fn.now(),
        }))
        .catch(() => database('builds').where({ id }).update({
            state: 'failed',
            ended: database.fn.now(),
        }));
}
