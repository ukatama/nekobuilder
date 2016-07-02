'use strict';

const builder = require('./builder');

const chunks = [];
process.stdin
    .on('data', (d) => chunks.push(d))
    .on('end', () => {
        try {
            const json = Buffer.concat(chunks).toString();
            const data = JSON.parse(json);
 
            builder
                .build(data)
                .then(() => {
                    console.log('Bulid done');
                    process.exit();
                })
                .catch((e) => {
                    console.error(e);
                    process.exit(1)
                });
        } catch (e) {
            console.error(e);
            process.exit(2);
        }
    });
