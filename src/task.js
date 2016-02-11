import { pick } from 'lodash';
import { getLogger } from 'log4js';
import { build } from './builder';
import { database } from './database';

const logger = getLogger('[TASK]');

let working = false;

/**
 * Run builder
 */
function runBuilder() {
    if (working) return;

    working = true;

    database('builds')
        .where('status', 'pending')
        .first()
        .then((b) => {
            if (!b) return false;

            return database('repositories')
                .where('id', b.repository_id)
                .then((r) => {
                    logger.info(
                        'Task started',
                        `${r.user}/${r.name}`,
                        b.ref,
                        b.commit_id,
                        b.commit_message
                    );

                    return database('builds').where('id', b.id).update({
                            state: 'building',
                        })
                        .then(() => build(r, b));
                })
                .then(() => database('builds').where('id', b.id).update({
                    state: 'succeeded',
                }))
                .catch(() => database('builds').where('id', b.id).update({
                    state: 'failed',
                }))
                .then(() => true);
        })
        .then((hasNext) => {
            logger.info('Task done');
            working = false;
            if (hasNext) runBuilder();
        });
}

/**
 * Push task to build
 * @param {Object} pushData - Object from github.
 */
export function pushTask(pushData) {
    const pushedRepo = {
        ...pick(pushData.repository, ['name', 'description', 'url']),
        user: pushData.repository.owner.name,
    };

    const headCommit = pushData.headCommit;
    const pushedBuild = {
        ref: pushData.ref,
        commit_id: headCommit.id,
        commit_message: headCommit.message,
        commit_author_name: headCommit.author.name,
    };

    database('repositories')
        .where('user', pushedRepo.user)
        .where('name', pushedRepo.name)
        .first()
        .then(
            (repo) => repo.id ||
                database('repositories')
                    .insert(pushedRepo)
                    .then((ids) => ids[0])
        )
        .then(
            (repository_id) => database('builds')
                .insert({
                    ...pushedBuild,
                    repository_id,
                })
        )
        .then(() => {
            logger.info(
                'Task pushed',
                pushData.repository.full_name,
                pushData.ref,
                pushData.head_commit && pushData.head_commit.id
            );

            runBuilder();
        });
}
