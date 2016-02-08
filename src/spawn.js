const byline = require('byline');
const child_process = require('child_process');
const log4js = require('log4js');

const createPromise = require('./util').createPromise;

const logger = log4js.getLogger('[spawn]');

const spawn = (command, args, options) =>
    createPromise((resolve, reject) => {
        const childLogger = log4js.getLogger(`[spawn:${command}]`);

        logger.info(command, args.join(' '));

        const child = child_process.spawn(command, args, Object.assign({
        }, options));

        child.stdout
            .pipe(byline.createStream())
            .on('data', (line) => {
                childLogger.info(line.toString('utf-8'));
            });

        child.stderr
            .pipe(byline.createStream())
            .on('data', (line) => {
                childLogger.error(line.toString('utf-8'));
            });

        child.stdin.end();

        child.on('error', (error) => {
            childLogger.error(error);
            reject(error);
        });
        child.on('close', (code) => {
            const msg = `${command} exited with code ${code}`;

            if (code === 0) {
                childLogger.info(msg);
                resolve();
            } else {
                childLogger.error(msg);
                reject(msg);
            }
        });
    });
module.exports = spawn;