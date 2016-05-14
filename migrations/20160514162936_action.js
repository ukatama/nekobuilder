'use strict';

exports.up = (knex, Promise) => Promise.all([
    knex.schema.createTable('actions', (table) => {
        table.increments('id').primary();
        table.integer('repository_id').notNullable();
        table.string('type');
        table.boolean('enabled').default(true).notNullable();
        table.string('options');
        table.index('repository_id');
    }),
]);

exports.down = (knex, Promise) => Promise.all([
    knex.schema.dropTable('actions'),
]);
