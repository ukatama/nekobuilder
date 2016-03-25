describe('Repository', () => {
    const TableBuilder = require('knex/lib/schema/tablebuilder');
    const ColumnBuilder = require('knex/lib/schema/columnbuilder');

    const {Model} = require('../model');

    jest.unmock('../repository');
    const {Repository} = require('../repository');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['repositories']]);
        expect(Model.mock.instances).toEqual([Repository]);
    });

    it('creates schema', () => {
        const column = new ColumnBuilder();
        column.references.mockReturnValue({
            inTable: jest.fn(),
        });
        [
            'index',
            'notNullable',
            'nullable',
            'unique',
        ].map((key) => column[key].mockReturnValue(column));
        const table = new TableBuilder();
        [
            'enum',
            'increments',
            'integer',
            'string',
            'text',
            'timestamp',
        ].map((key) => table[key].mockReturnValue(column));

        Repository.fn = {
            now: jest.fn(),
        };

        Repository.schema(table);
    });
});
