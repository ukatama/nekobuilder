'use strict';

function create(knex, name, table) {
    return knex.schema
        .hasTable(name)
        .then((exists) => {
            if (!exists) return knex.schema.createTable(name, table);
        });
}

exports.up = (knex, Promise) => Promise.all([
    create(knex, 'repositories', (table) => {
        table.increments('id').primary();
        table.string('user').notNullable();
        table.string('name').notNullable();
        table.string('full_name')
            .notNullable()
            .unique()
            .index();
        table.text('description').notNullable();
        table.string('url').notNullable();
        table.string('clone_url').notNullable();
        table.index(['user', 'name']);
        table.unique(['user', 'name']);
    }),
    create(knex, 'builds', (table) => {
        table.increments('id').primary();
        table.integer('repository_id')
            .references('id')
            .inTable('repositories');
        table.string('ref').notNullable();
        table.string('commit_url').notNullable();
        table.string('commit_id').notNullable();
        table.string('commit_message').notNullable();
        table.string('commit_author_name').notNullable();
        table.enum('state', [
            'pending',
            'building',
            'succeeded',
            'failed',
        ]).notNullable().default('pending');
        table.timestamp('started')
            .notNullable()
            .default(knex.fn.now());
        table.timestamp('ended')
            .nullable();
    }),
    create(knex, 'logs', (table) => {
        table.increments('id').primary();
        table.integer('build_id')
            .references('id')
            .inTable('repositories');
        table.boolean('error').notNullable().default(false);
        table.text('line').notNullable();
        table.timestamp('timestamp')
            .notNullable()
            .default(knex.fn.now());
    }),
]);

exports.down = (knex, Promise) => Promise.all([
]);
