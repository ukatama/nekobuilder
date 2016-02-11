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
        .where('state', 'pending')
        .first()
        .then((b) => {
            if (!b) return false;

            return database('repositories')
                .where('id', b.repository_id)
                .first()
                .then((r) => {
                    logger.info(
                        'Task started',
                        r.full_name,
                        b.ref,
                        b.commit_id,
                        b.commit_message
                    );

                    return build(b.id);
                })
                .then(() => true);
        })
        .catch((e) => logger.error(e) || true)
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
        ...pick(
            pushData.repository,
            ['name', 'description', 'url', 'full_name', 'clone_url']
        ),
        user: pushData.repository.owner.name,
    };

    const headCommit = pushData.head_commit;
    if (!headCommit) return;

    const pushedBuild = {
        ref: pushData.ref,
        commit_id: headCommit.id,
        commit_message: headCommit.message,
        commit_author_name: headCommit.author.name,
        commit_url: headCommit.url,
    };

    database('repositories')
        .where('user', pushedRepo.user)
        .where('name', pushedRepo.name)
        .first()
        .then(
            (repo) => repo && repo.id ||
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
