describe('Repository', () => {
    const {Model} = require('../model');

    jest.unmock('../repository');
    const {Repository} = require('../repository');

    it('is model', () => {
        expect(Model.mock.calls).toEqual([['repositories']]);
        expect(Model.mock.instances).toEqual([Repository]);
    });
});
