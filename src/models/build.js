import {Model} from './model';

export class BuildModel extends Model {
    constructor() {
        super('builds');
    }

    schema(table) {
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
            .default(this.fn.now());
        table.timestamp('ended')
            .nullable();
    }
}
export const Build = new BuildModel();
