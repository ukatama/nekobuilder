'use strict';

const spawn = require('./spawn');

const build = (buildData) => {
    const build = buildData.build;
    const repository = buildData.repository;
    const actions = buildData.actions;

    console.log(build);
    console.log(repository);

    const ref = build.ref;
    const id = build.commit_id;

    const clone_url = repository.clone_url;
    const full_name = repository.full_name;

    const image_name = full_name.toLowerCase();
    const tag = ref.split('/')[2];

    const ref_type = ref.split('/')[1];
    const latest = ref_type === 'heads' && (
        tag === 'master' ? 'latest' : `${tag}-latest`
    );

    console.log('Build started');

    return spawn('git', ['init', 'build'])
        .then(() => spawn('git', ['fetch', clone_url, tag], 'build'))
        .then(() => spawn('git', ['checkout', '--force', id], 'build'))
        .then(() => spawn('git', ['submodule', 'update', '--init', '--recursive'], 'build'))
        .then((env) => spawn('docker', ['build', '-t', `${image_name}:${tag}`, '.'], 'build', {
            env: env,
        }))
        .then(() => latest &&
            spawn('docker', ['tag', '-f', `${image_name}:${tag}`, `${image_name}:${latest}`])
        )
        .then(() => actions && Promise.all(actions.map((action) => {
            switch (action.type) {
                case 'stop':
                    return spawn('docker', ['stop', '--timeout', 3, action.options]);
                default:
                    return Promise.resolve();
            }
        })));
};
module.exports.build = build;
