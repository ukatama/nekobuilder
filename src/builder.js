import { spawn } from 'child_process';

/**
 * Build from pushed json
 * @param {Object} pushData - Object from github.
 * @return {Promise} Resolved when build done. Rected when failed.
 */
export function build(pushData) {
    return new Promise((resolve, reject) => {
        try {
            const child = spawn('docker', [
                '--rm',
                '-i',
                '-v /usr/bin/docker:/usr/bin/docker:ro',
                '-v /var/run/docker.sock:/var/run/docker.sock:ro',
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

            child.stdin.write(JSON.stringify(pushData)).end();

            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        } catch (e) {
            reject(e);
        }
    });
}