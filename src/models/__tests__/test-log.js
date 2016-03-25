describe('Log', () => {
    const TableBuilder = require('knex/lib/schema/tablebuilder');
    const ColumnBuilder = require('knex/lib/schema/columnbuilder');

    const {Model} = require('../model');

    jest.unmock('../log');
    const {Log} = require('../log');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['logs']]);
        expect(Model.mock.instances).toEqual([Log]);
    });

    it('creates schema', () => {
        const column = new ColumnBuilder();
        column.references.mockReturnValue({
            inTable: jest.fn(),
        });
        [
            'notNullable',
            'nullable',
        ].map((key) => column[key].mockReturnValue(column));
        const table = new TableBuilder();
        [
            'boolean',
            'enum',
            'increments',
            'integer',
            'string',
            'text',
            'timestamp',
        ].map((key) => table[key].mockReturnValue(column));

        Log.fn = {
            now: jest.fn(),
        };

        Log.schema(table);
    });
});
