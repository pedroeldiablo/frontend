import Promise from 'Promise';
import config from 'common/utils/config';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import memoize from 'lodash/functions/memoize';
const setupSonobi = memoize(() => Promise.resolve(require(['js!sonobi.js'])).then(catchPolyfillErrors));

// Wrap the native implementation of getOwnPropertyNames in a try-catch. If any polyfill attempts
// to re-implement this function, and doesn't consider the "access permissions" issue that exists in IE11,
// then the resulting "Access Denied" error will be caught. Without this, the error is always delivered to Sentry,
// but does not pass through window.onerror. More info here: https://github.com/paulmillr/es6-shim/issues/333
function catchPolyfillErrors() {
    // Skip polyfill error-catch in dev environments.
    if (config.page.isDev) {
        return Promise.resolve();
    }

    const nativeGetOwnPropertyNames = Object.getOwnPropertyNames;
    Object.getOwnPropertyNames = (obj) => {
        try {
            return nativeGetOwnPropertyNames(obj);
        } catch (e) {
            // continue regardless of error
            return [];
        }
    };
    return Promise.resolve();
}

function init() {
    return dfpEnv.sonobiEnabled && commercialFeatures.dfpAdvertising ? setupSonobi() : Promise.resolve();
}

export default {
    init,
};
