describe('Build', () => {
    const {Model, NOT_FOUND} = require('../model');
    const {Log} = require('../log');
    const {Repository} = require('../repository');

    jest.unmock('../build');
    const {Build} = require('../build');
    Build.fn = {
        now: jest.fn(),
    };

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['builds']]);
        expect(Model.mock.instances).toEqual([Build]);
    });

    pit('creates a new item from GitHub hook JSON', () => {
        const data = {
            repository: {
                name: 'name',
                description: 'description',
                url: 'url',
                full_name: 'full_name',
                clone_url: 'clone_url',
                owner: {
                    name: 'owner_name',
                },
            },
            ref: 'ref',
            head_commit: {
                id: 'head_cid',
                message: 'head_msg',
                author: {
                    name: 'author_name',
                },
                url: 'head_url',
            },
        };

        const result = {
            id: 4,
            repository_id: 2,
            ref: 'ref',
            commit_id: 'cid',
            commit_message: 'msg',
            commit_url: 'curl',
            commit_author_name: 'author_name',
        };
        Build.create.mockReturnValue(Promise.resolve(result));
        Repository.update.mockReturnValue(Promise.resolve({
            id: 2,
            user: 'owner_name',
            name: 'name',
        }));

        return Build.fromHook(data)
            .then((build) => {
                expect(Repository.update.mock.calls).toEqual([[
                    {name: 'name', description: 'description'},
                    {user: 'owner_name', name: 'name'},
                ]]);
                expect(Build.create.mock.calls).toEqual([[{
                    repository_id: 2,
                    ref: 'ref',
                    commit_id: 'head_cid',
                    commit_message: 'head_msg',
                    commit_url: 'head_url',
                    commit_author_name: 'author_name',
                }]]);
                expect(build).toEqual(result);
            });
    });

    pit('creates a new repository from GitHub hook JSON', () => {
        Repository.update.mockClear();
        Build.create.mockClear();

        const data = {
            repository: {
                name: 'name',
                description: 'description',
                url: 'url',
                full_name: 'full_name',
                clone_url: 'clone_url',
                owner: {
                    name: 'owner_name',
                },
            },
            ref: 'ref',
            head_commit: {
                id: 'head_cid',
                message: 'head_msg',
                author: {
                    name: 'author_name',
                },
                url: 'head_url',
            },
        };

        const result = {
            id: 4,
            repository_id: 2,
            ref: 'ref',
            commit_id: 'cid',
            commit_message: 'msg',
            commit_url: 'curl',
            commit_author_name: 'author_name',
        };
        Build.create.mockReturnValue(Promise.resolve(result));
        Repository.update.mockReturnValue(Promise.reject(NOT_FOUND));
        Repository.create.mockReturnValue(Promise.resolve({
            id: 2,
            user: 'owner_name',
            name: 'name',
        }));

        return Build.fromHook(data)
            .then((build) => {
                expect(Repository.update.mock.calls).toEqual([[
                    {name: 'name', description: 'description'},
                    {user: 'owner_name', name: 'name'},
                ]]);
                expect(Repository.create.mock.calls).toEqual([[{
                    user: 'owner_name',
                    name: 'name',
                    full_name: 'full_name',
                    description: 'description',
                    url: 'url',
                    clone_url: 'clone_url',
                }]]);
                expect(Build.create.mock.calls).toEqual([[{
                    repository_id: 2,
                    ref: 'ref',
                    commit_id: 'head_cid',
                    commit_message: 'head_msg',
                    commit_url: 'head_url',
                    commit_author_name: 'author_name',
                }]]);
                expect(build).toEqual(result);
            });
    });

    pit('ignores branch deleted hook', () => {
        Repository.create.mockClear();
        Repository.update.mockClear();
        Build.create.mockClear();

        const data = {
            repository: {
                name: 'name',
                description: 'description',
                url: 'url',
                full_name: 'full_name',
                clone_url: 'clone_url',
                owner: {
                    name: 'owner_name',
                },
            },
            ref: null,
            head_commit: null,
        };

        return Build.fromHook(data)
            .then((result) => {
                expect(result).toBeNull();
                expect(Build.create).not.toBeCalled();
            });
    });

    pit('rebuilds', () => {
        Build.findOne.mockReturnValue(Promise.resolve({
            id: 3,
        }));
        Build.update.mockReturnValue(Promise.resolve({
            id: 3,
        }));
        Log.delete.mockReturnValue(Promise.resolve());

        return Build.rebuild('id', 3)
            .then(() => {
                expect(Build.findOne.mock.calls).toEqual([['id', 3]]);
                expect(Build.update.mock.calls).toEqual([[{
                    state: 'pending',
                    started: Build.fn.now(),
                }, {id: 3}]]);
                expect(Log.delete.mock.calls).toEqual([['build_id', 3]]);
            });
    });
});
