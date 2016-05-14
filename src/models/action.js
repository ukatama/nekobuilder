import {Model} from './model';

export class ActionModel extends Model {
    constructor() {
        super('actions');
    }
}
export const Action = new ActionModel();
