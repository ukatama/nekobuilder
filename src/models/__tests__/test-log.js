describe('Log', () => {
    const {Model} = require('../model');

    jest.unmock('../log');
    const {Log} = require('../log');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['logs']]);
        expect(Model.mock.instances).toEqual([Log]);
    });
});
