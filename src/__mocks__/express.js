/* global jest */

const app = {
    get: jest.genMockFunction(),
    post: jest.genMockFunction(),
    listen: jest.genMockFunction(),
};
const express = jest.genMockFunction().mockReturnValue(app);
express.app = app;
module.exports = express;