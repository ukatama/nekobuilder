import Converter from 'ansi-to-html';
import {urlencoded} from 'body-parser';
import {createHmac} from 'crypto';
import express from 'express';
import _ from 'lodash';
import {getLogger} from 'log4js';
import moment from 'moment';
import {join} from 'path';
import {Action} from './models/action';
import {Build} from './models/build';
import {Log} from './models/log';
import {Repository} from './models/repository';

const converter = new Converter();
const logger = getLogger('[APP]');
const app = express();

app.set('view engine', 'jade');
app.set('views', join(__dirname, '../views'));

app.use('/octicons', express.static(join(
    __dirname,
    '../node_modules/octicons/octicons'
)));

app.post('/hook', (req, res, next) => {
    const signature = req.get('X-Hub-Signature');
    logger.info(signature);

    const event = req.get('X-GitHub-Event');
    logger.info(event);

    if (!signature) return res.status(400).end();

    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
        if (event === 'push') {
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

            return Build.fromHook(JSON.parse(body))
                .then(() => res.send('Build started.'))
                .catch(next);
        }

        logger.info(event);
        res.status(200).end();
    });
});

app.get('/', (req, res, next) =>
    Repository.findAll()
        .then((repos) => Promise.all(
            repos.map((repo) => Build
                .find('repository_id', repo.id)
                .orderBy('started', 'DESC')
                .first()
                // eslint-disable-next-line max-nested-callbacks
                .then((build) => ({
                    ...build,
                    ...repo,
                    started: new Date(build.started),
                }))
            )
        ))
        .then((repos) => repos.sort((a, b) => (a.started < b.started)))
        .then((repos) => repos.map((repo) => ({
            ...repo,
            started: moment(repo.stareted).format('lll'),
        })))
        .then((repos) => res.render('repos', {repos}))
        .catch(next)
);

app.get('/:repoId([0-9]+)', (req, res, next) =>
    Promise
        .all([
            Repository.findOne('id', +req.params.repoId),
            Build.find('repository_id', +req.params.repoId),
            Action.find('repository_id', +req.params.repoId),
        ])
        .then(([repo, builds, actions]) => ({
            repo,
            builds: builds.map((build) => ({
                ...build,
                started: moment(build.started).format('lll'),
            })).reverse(),
            actions,
        }))
        .then((data) => res.render('repo', data))
        .catch(next)
);

app.get('/:repoId([0-9]+)/:buildId([0-9]+)', (req, res, next) =>
    Promise
        .all([
            Repository.findOne('id', +req.params.repoId),
            Build.findOne('id', +req.params.buildId),
            Log
                .find('build_id', +req.params.buildId)
                .orderBy('id', 'ASC')
                .then((logs) => logs.map((log) => ({
                    ...log,
                    line: converter.toHtml(log.line),
                    timestamp: moment(log.timestamp).format('HH:mm:ss'),
                }))),
        ])
        .then(([repo, build, logs]) =>
            res.render('build', {repo, build, logs})
        )
        .catch(next)
);

app.post('/:repoId([0-9]+)/:buildId([0-9]+)/rebuild', (req, res, next) =>
    Build.rebuild('id', +req.params.buildId)
        .then(({repository_id, id}) => res.redirect(`/${repository_id}/${id}`))
        .catch(next)
);

app.post('/:repoId([0-9]+)/action/new', (req, res, next) =>
    Action.create({repository_id: +req.params.repoId})
        .then(
            ({id, repository_id}) =>
                res.redirect(`/${repository_id}/action/${id}`)
        )
        .catch(next)
);

app.get('/:repoId([0-9]+)/action/:actionId([0-9]+)', (req, res) =>
    Promise.all([
        Action.findOne('id', +req.params.actionId),
        Repository.findOne('id', +req.params.repoId),
    ])
    .then(([action, repo]) => res.render('action', {action, repo}))
);

app.post(
    '/:repoId([0-9]+)/action/:actionId([0-9]+)',
    urlencoded({extended: true}),
    ({body, params}, res) =>
        Action
            .update(
                _(body)
                    .pick('type', 'options', 'branch')
                    .mapValues((v) => v || null)
                    .value(),
                'id',
                +params.actionId
            )
            .then(() => res.redirect(`/${params.repoId}`))
);

app.delete(
    '/:repoId([0-9]+)/action/:actionId([0-9]+)',
    ({params}, res, next) => Action
        .delete('id', +params.actionId)
        .then(() => res.redirect(`/${params.repoId}`))
        .catch(next)
);
app.post(
    '/:repoId([0-9]+)/action/:actionId([0-9]+)/delete',
    ({params}, res, next) => Action
        .delete('id', +params.actionId)
        .then(() => res.redirect(`/${params.repoId}`))
        .catch(next)
);

app.listen(process.env.PORT || 80, () => {
    logger.info('Listening');
});
