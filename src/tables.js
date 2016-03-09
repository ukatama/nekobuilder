import { forEach } from 'lodash';

export const initialize = (database) => {
    forEach({
        repositories: (table) => {
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
        },
        builds: (table) => {
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
                .default(database.fn.now());
            table.timestamp('ended')
                .nullable();
        },
        logs: (table) => {
            table.increments('id').primary();
            table.integer('build_id')
                .references('id')
                .inTable('repositories');
            table.boolean('error').notNullable().default(false);
            table.text('line').notNullable();
            table.timestamp('timestamp')
                .notNullable()
                .default(database.fn.now());
        },
    }, (creator, name) => {
        database.schema.hasTable(name)
            .then(
                (exists) => exists || database.schema.createTable(name, creator)
            );
    });
};
