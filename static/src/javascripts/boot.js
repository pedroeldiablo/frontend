/*
This module is responsible for booting the application. It is concatenated with
curl and bootstraps/standard into app.js

We download the bundles in parallel, but they must be executed
sequentially because each bundle assumes dependencies from the previous
bundle.

Once a bundle has been executed, all of its modules have been registered.
Now we can safely require one of those modules.

Unfortunately we can't do all of this using the curl API, so we use a
combination of ajax/eval/curl instead.

Bundles we need to run: commercial + enhanced

Only if we detect we should run enhance.
 */

import Promise from 'Promise';
import domReady from 'domReady';
import raven from 'common/utils/raven';
// curl’s promise API is broken, so we must cast it to a real Promise
// https://github.com/cujojs/curl/issues/293
const promiseRequire = function (moduleIds) {
    return Promise.resolve(require(moduleIds));
};

const guardian = window.guardian;
const config = guardian.config;

const domReadyPromise = new Promise((resolve) => {
    domReady(resolve);
});

const bootStandard = function () {
    return promiseRequire(['bootstraps/standard/main'])
        .then((boot) => {
            boot();
        });
};

const bootCommercial = function () {
    if (!config.switches.commercial) {
        return;
    }

    if (config.page.isDev) {
        guardian.adBlockers.onDetect.push((isInUse) => {
            const needsMessage = isInUse && window.console && window.console.warn;
            const message = 'Do you have an adblocker enabled? Commercial features might fail to run, or throw exceptions.';
            if (needsMessage) {
                window.console.warn(message);
            }
        });
    }

    return promiseRequire(['bootstraps/commercial'])
        .then(raven.wrap({
            tags: {
                feature: 'commercial',
            },
        },
            (commercial) => {
                commercial.init();
            }
        ));
};

const bootEnhanced = function () {
    if (guardian.isEnhanced) {
        return promiseRequire(['bootstraps/enhanced/main'])
            .then((boot) => {
                boot();
            });
    }
};

domReadyPromise
    .then(bootStandard)
    .then(bootCommercial)
    .then(bootEnhanced);
