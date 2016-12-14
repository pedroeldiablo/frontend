import Promise from 'Promise';
/**
 * Make a Promise fail if it didn't resolve quickly enough
 */
export default function (interval, promise) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Timeout'));
            }, interval);
        }),
    ]);
}
