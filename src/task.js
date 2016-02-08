import { getLogger } from 'log4js';
import { build } from './builder';

const logger = getLogger('[TASK]');

const tasks = [];
let working = false;

/**
 * Run builder
 */
function runBuilder() {
    if (working || tasks.length === 0) return;

    working = true;
    const task = tasks.shift();

    logger.info(
        'Task started',
        task.repository.full_name,
        task.ref,
        task.head_commit.id
    );

    build(task)
        .then(() => null)
        .catch(() => null)
        .then(() => {
            if (tasks.length > 0) {
                runBuilder();
            } else {
                working = false;
            }
        });
}

/**
 * Push task to build
 * @param {Object} pushData - Object from github.
 */
export function pushTask(pushData) {
    tasks.push(pushData);

    logger.info(
        'Task pushed',
        pushData.repository.full_name,
        pushData.ref,
        pushData.head_commit.id
    );

    runBuilder();
}