import {pick} from 'lodash';
import {getLogger} from 'log4js';
import {build} from './builder';
import {NOT_FOUND} from './models/model';
import {Build} from './models/build';
import {Repository} from './models/repository';

const logger = getLogger('[TASK]');

let working = false;

/**
 * Run builder
 * @returns {Promise} promise
 */
function runBuilder() {
    if (working) return Promise.resolve();

    working = true;

    return Build
        .find('state', 'pending')
        .first()
        .then((b) =>
            b && Repository.findOne('id', b.repository_id)
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
                .then(() => true)
        )
        .catch((e) => {
            logger.error(e);

            return true;
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
 * @returns {Promise} promise
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

    return Repository
        .findOne({
            user: pushedRepo.user,
            name: pushedRepo.name,
        })
        .catch((e) => e === NOT_FOUND
            ? Repository.create(pushedRepo)
            : Promise.reject(e)
        )
        .then((repo) => Build.create({
            ...pushedBuild,
            repository_id: repo.id,
        }))
        .then(() => {
            logger.info(
                'Task pushed',
                pushData.repository.full_name,
                pushData.ref,
                pushData.head_commit && pushData.head_commit.id
            );

            return runBuilder();
        })
        .catch((e) => logger.error(e));
}
