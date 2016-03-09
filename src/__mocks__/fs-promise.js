const createPromise = require('../util').createPromise;

module.exports = {
    exists: createPromise,
    mkdir: createPromise,
};
