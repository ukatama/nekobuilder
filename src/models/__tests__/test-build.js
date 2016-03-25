describe('Build', () => {
    const TableBuilder = require('knex/lib/schema/tablebuilder');
    const ColumnBuilder = require('knex/lib/schema/columnbuilder');

    const {Model} = require('../model');

    jest.unmock('../build');
    const {Build} = require('../build');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['builds']]);
        expect(Model.mock.instances).toEqual([Build]);
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
            'enum',
            'increments',
            'integer',
            'string',
            'timestamp',
        ].map((key) => table[key].mockReturnValue(column));

        Build.fn = {
            now: jest.fn(),
        };

        Build.schema(table);
    });
});
