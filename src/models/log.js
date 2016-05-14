import {Model} from './model';

export class LogModel extends Model {
    constructor() {
        super('logs');
    }
}
export const Log = new LogModel();
