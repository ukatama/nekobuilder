import { createHmac } from 'crypto';
import express from 'express';
import { getLogger } from 'log4js';
import { pushTask } from './task';

const logger = getLogger('[APP]');

const app = express();

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
            case 'push': {
                const body = Buffer.concat(chunks).toString('utf-8');

                const localSignature =
                    createHmac('sha1', process.env.SECRET)
                        .update(body)
                        .digest('hex');
                if (signature !== `sha1=${localSignature}`) {
                    console.log(
                        `${signature} does not matched with ${localSignature}`
                    );
                    return res.status(400).end();
                }

                const pushData = JSON.parse(body);
                res.send('Build started.');
                pushTask(pushData);
                return null;
            } default:
                logger.info(event);
                res.status(200).end();
                return null;
        }
    });
});

app.listen(process.env.PORT || 80, () => {
    console.log('Listening');
});
