/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources will overwrite property assignments of previous
 * sources.
 */
const assign = 'assign' in Object ? assignNative : assignPolyfill;
export default assign;

function assignNative() {
    return Object.assign.apply(undefined, arguments);
}

function assignPolyfill(target) {
    for (let i = 1, ii = arguments.length; i < ii; i++) {
        const source = arguments[i];
        if (source) {
            Object.keys(source).forEach((key) => {
                target[key] = source[key];
            });
        }
    }
    return target;
}
