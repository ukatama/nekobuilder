import {Model, NOT_FOUND} from './model';
import {Log} from './log';
import {Repository} from './repository';

export class BuildModel extends Model {
    constructor() {
        super('builds');
    }

    fromHook({ref, head_commit, repository}) {
        return Repository
            .update({
                name: repository.name,
                description: repository.description,
            }, {
                user: repository.owner.name,
                name: repository.name,
            })
            .catch((e) => e === NOT_FOUND ? Repository.create({
                user: repository.owner.name,
                name: repository.name,
                full_name: repository.full_name,
                description: repository.description,
                url: repository.url,
                clone_url: repository.clone_url,
            }) : Promise.reject(e))
            .then((repo) => (ref && head_commit) ? this.create({
                repository_id: repo.id,
                ref,
                commit_url: head_commit.url,
                commit_id: head_commit.id,
                commit_message: head_commit.message,
                commit_author_name: head_commit.author.name,
            }) : null);
    }

    rebuild(...where) {
        return this.findOne(...where)
            .then((build) => Log.delete('build_id', build.id).then(() => build))
            .then((build) => this.update({
                state: 'pending',
                started: this.fn.now(),
            }, {id: build.id}));
    }
}
export const Build = new BuildModel();
