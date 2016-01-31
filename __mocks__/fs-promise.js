const createPromise = require('../lib/util').createPromise;

module.exports = {
    exists: createPromise,
    mkdir: createPromise,
};