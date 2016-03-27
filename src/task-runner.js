import {getLogger} from 'log4js';
import {build} from './builder';
import {Build} from './models/build';
import {Repository} from './models/repository';

const logger = getLogger('[TaskRunner]');

export const start = () => Build
    .find('state', 'pending')
    .orderBy('started', 'ASC')
    .first()
    .then((b) =>
        b && Repository
            .findOne('id', b.repository_id)
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
    .catch((e) => logger.error(e))
    .then((found) => setTimeout(start, found ? 0 : 5000));
