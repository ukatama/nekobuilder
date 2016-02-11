import { createHmac } from 'crypto';
import express from 'express';
import { getLogger } from 'log4js';
import moment from 'moment';
import { join } from 'path';
import { database } from './database';
import { pushTask } from './task';

const logger = getLogger('[APP]');

const app = express();

app.set('view engine', 'jade');
app.set('views', join(__dirname, '../views'));

app.use('/octicons', express.static(join(
    __dirname,
    '../node_modules/octicons/octicons'
)));

app.post('/hook', (req, res) => {
    const signature = req.get('X-Hub-Signature');
    logger.info(signature);

    const event = req.get('X-GitHub-Event');
    logger.info(event);

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
                    logger.info(
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

app.get('/', (req, res) =>
    database
        .select(
            'repositories.*',
            'ref',
            'commit_message', 'commit_author_name',
            'state', 'started'
        )
        .from(function() {
            this.max('id as id')
                .groupBy('repository_id')
                .from('builds')
                .as('build_ids');
        })
        .join('builds', 'build_ids.id', 'builds.id')
        .join('repositories', 'builds.repository_id', 'repositories.id')
        .orderBy('builds.started', 'DESC')
        .then((repos) => res.render('repos', { repos }))
);

const enforceFound = (a) => a || Promise.reject(new Error('Not found'));

app.get('/:repoId([0-9]+)', (req, res) =>
    Promise.all([
        database('repositories')
            .where('id', +req.params.repoId)
            .first()
            .then(enforceFound),
        database('builds')
            .where('repository_id',  +req.params.repoId)
            .orderBy('id', 'DESC'),
    ])
    .then(([repo, builds]) =>
        res.render('repo', {
            repo,
            builds,
        })
    )
    .catch(() => res.sendStatus(404))
);

app.get('/:repoId([0-9]+)/:buildId([0-9]+)', (req, res) =>
    Promise.all([
        database('repositories')
            .where('id', +req.params.repoId)
            .first()
            .then(enforceFound),
        database('builds')
            .where('id', +req.params.buildId)
            .first()
            .then(enforceFound),
        database('logs')
            .where('build_id', +req.params.buildId)
            .orderBy('id', 'ASC'),
    ])
    .then(([repo, build, logs]) => {
        res.render('build', {
            repo,
            build,
            logs: logs.map((log) => ({
                ...log,
                timestamp: moment(log.timestamp).format('HH:mm:ss'),
            })),
        });
    })
    .catch(() => res.sendStatus(404))
);

app.listen(process.env.PORT || 80, () => {
    logger.info('Listening');
});