describe('Action', () => {
    const {Model} = require('../model');

    jest.unmock('../action');
    const {Action} = require('../action');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['actions']]);
        expect(Model.mock.instances).toEqual([Action]);
    });
});
