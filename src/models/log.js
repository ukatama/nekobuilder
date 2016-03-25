import {Model} from './model';

export class LogModel extends Model {
    constructor() {
        super('logs');
    }

    schema(table) {
        table.increments('id').primary();
        table.integer('build_id')
            .references('id')
            .inTable('repositories');
        table.boolean('error').notNullable().default(false);
        table.text('line').notNullable();
        table.timestamp('timestamp')
            .notNullable()
            .default(this.fn.now());
    }
}
export const Log = new LogModel();
