describe('Model', () => {
    const {create, extend} = require('lodash');

    const Knex = require('knex');
    const SchemaBuilder = require('knex/lib/schema/builder');
    const TableBuilder = require('knex/lib/schema/tablebuilder');
    const knex = jest.fn();
    extend(knex, {
        schema: new SchemaBuilder(),
    });
    Knex.mockReturnValue(knex);

    jest.unmock('../model');
    const {Model, NOT_FOUND} = require('../model');

    const genQuery = (result) => {
        const query = Promise.resolve(result);
        query.where = jest.fn().mockReturnValue(query);
        query.first = jest.fn().mockReturnValue(query);
        query.insert = jest.fn();
        query.update = jest.fn();
        query.delete = jest.fn();

        return query;
    };

    let Test;
    pit('initializes schema', () => {
        knex.schema.hasTable.mockReturnValue(Promise.resolve(false));

        const TestModel = function () {
            Model.call(this, 'test-table');
        };
        TestModel.prototype = create(Model.prototype, {
            constructor: Model,
            schema: jest.fn(),
        });

        Test = new TestModel();

        return Promise.resolve()
            .then(() => {
                expect(knex.schema.createTable).toBeCalled();

                const call = knex.schema.createTable.mock.calls[0];
                expect(call[0]).toEqual('test-table');
                call[1](new TableBuilder());
                expect(Test.schema).toBeCalled();
            });
    });

    pit('creates a new item', () => {
        const result = {
            id: 1,
            name: 'item1',
        };
        const query = genQuery(result);
        query.insert.mockReturnValue(Promise.resolve([1]));
        knex.mockReturnValue(query);

        return Test.create({name: 'item1'})
            .then((item) => {
                expect(item).toEqual(result);

                expect(knex.mock.calls).toEqual([
                    ['test-table'],
                    ['test-table'],
                ]);
                expect(query.insert.mock.calls).toEqual([[{name: 'item1'}]]);
                expect(query.where.mock.calls).toEqual([['id', 1]]);
            });
    });

    pit('finds all items', () => {
        const result = [
            {
                id: 1,
                user_id: 'user1',
                name: 'item1',
            },
            {
                id: 2,
                user_id: 'user1',
                name: 'item2',
            },
        ];
        const query = genQuery(result);
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.findAll()
            .then((items) => {
                expect(items).toEqual(result);
                expect(knex.mock.calls).toEqual([['test-table']]);
                expect(query.where.mock.calls).toEqual([]);
            });
    });

    pit('finds items', () => {
        const result = [
            {
                id: 1,
                user_id: 'user1',
                name: 'item1',
            },
            {
                id: 2,
                user_id: 'user1',
                name: 'item2',
            },
        ];
        const query = genQuery(result);
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.find('user_id', 'user1')
            .then((items) => {
                expect(items).toEqual(result);
                expect(knex.mock.calls).toEqual([['test-table']]);
                expect(query.where.mock.calls).toEqual([['user_id', 'user1']]);
            });
    });

    pit('finds an item', () => {
        const result = {
            id: 2,
            name: 'item2',
        };
        const query = genQuery(result);
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.findOne('id', 2)
            .then((item) => {
                expect(item).toEqual(result);
                expect(knex.mock.calls).toEqual([['test-table']]);
                expect(query.where.mock.calls).toEqual([['id', 2]]);
                expect(query.first.mock.calls).toEqual([[]]);
            });
    });

    pit('thorws not found error if could not find an item', () => {
        const query = genQuery();
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.findOne('id', 3)
            .then(() => {
                throw new Error('Promise should not be resolved');
            })
            .catch((e) => {
                expect(e).toBe(NOT_FOUND);
            });
    });

    pit('updates an item', () => {
        const result = {
            id: 3,
            name: 'item3u',
        };
        const query = genQuery(result);
        query.update.mockReturnValue(Promise.resolve());
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.update({name: 'item3u'}, 'id', 3)
            .then((item) => {
                expect(item).toEqual(result);
                expect(knex.mock.calls).toEqual([
                    ['test-table'],
                    ['test-table'],
                ]);
                expect(query.where.mock.calls).toEqual([
                    ['id', 3],
                    ['id', 3],
                ]);
                expect(query.first.mock.calls).toEqual([[]]);
            });
    });

    pit('deletes an item', () => {
        const query = genQuery();
        query.delete.mockReturnValue(Promise.resolve());
        knex.mockClear();
        knex.mockReturnValue(query);

        return Test.delete('id', 4)
            .then(() => {
                expect(knex.mock.calls).toEqual([['test-table']]);
                expect(query.where.mock.calls).toEqual([['id', 4]]);
                expect(query.delete.mock.calls).toEqual([[]]);
            });
    });
});
