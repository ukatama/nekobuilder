/* global jest */

const app = {
    get: jest.genMockFunction(),
    set: jest.genMockFunction(),
    use: jest.genMockFunction(),
    post: jest.genMockFunction(),
    listen: jest.genMockFunction(),
};
const express = jest.genMockFunction().mockReturnValue(app);
express.app = app;
express.static = jest.genMockFunction();
module.exports = express;