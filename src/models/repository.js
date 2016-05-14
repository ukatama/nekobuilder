import {Model} from './model';

export class RepositoryModel extends Model {
    constructor() {
        super('repositories');
    }
}
export const Repository = new RepositoryModel();
