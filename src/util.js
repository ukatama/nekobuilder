/**
 * Create promise object
 * @param{Function} func - Asyncronous function
 * @returns{Promise} Promise
 */
export function createPromise(func) {
    return new Promise(func);
}
