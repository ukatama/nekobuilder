'use strict';

exports.up = (knex, Promise) =>
    knex.schema.table('actions', (table) => {
        table.string('branch')
            .after('options');
    });

exports.down = (knex, Promise) =>
    knex.schema.table('actions', (table) => {
        table.dropColumn('branch');
    });
