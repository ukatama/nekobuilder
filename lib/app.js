'use strict';

const crypto = require('crypto');
const express = require('express');
const fs = require('fs-promise');
const log4js = require('log4js');
const path = require('path');
const builder = require('./builder');

const logger = log4js.getLogger('[APP]');

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
            case 'push':
                const body = Buffer.concat(chunks).toString('utf-8');
        
                const localSignature = crypto.createHmac('sha1', process.env.SECRET).update(body).digest('hex');
                if (signature !== `sha1=${localSignature}`) {
                    console.log(signature, ' does not matched with ', localSignature);
                    return res.status(400).end();
                }
        
                const push = JSON.parse(body);
                res.send('Build started.');
                builder.build(push);
                return;
            default:
                logger.info(event);
                res.status(200).end();
                return;
        }
    });
});

app.listen(process.env.PORT || 80, () => {
    console.log('Listening');
});
