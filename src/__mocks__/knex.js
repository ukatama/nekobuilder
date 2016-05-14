'use strict';

const knex = jest.fn();
knex.migrate = {
    latest: jest.fn().mockReturnValue(Promise.resolve()),
};
knex.fn = {
    now: jest.fn(),
};

module.exports = jest.fn().mockReturnValue(knex);
