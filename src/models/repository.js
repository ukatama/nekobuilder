import {Model} from './model';

export class RepositoryModel extends Model {
    constructor() {
        super('repositories');
    }

    schema(table) {
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
    }
}
export const Repository = new RepositoryModel();
