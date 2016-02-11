import config from 'config';
import knex from 'knex';
import { initialize } from './tables';

export const database = knex(config.get('database'));
initialize(database);