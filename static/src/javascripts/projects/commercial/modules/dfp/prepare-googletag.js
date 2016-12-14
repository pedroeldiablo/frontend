import Promise from 'Promise';
import qwery from 'qwery';
import bonzo from 'bonzo';
import raven from 'common/utils/raven';
import config from 'common/utils/config';
import fastdom from 'common/utils/fastdom-promise';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import buildPageTargeting from 'commercial/modules/build-page-targeting';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import onSlotRender from 'commercial/modules/dfp/on-slot-render';
import onSlotLoad from 'commercial/modules/dfp/on-slot-load';
import prepareSonobiTag from 'commercial/modules/dfp/prepare-sonobi-tag';
import performanceLogging from 'commercial/modules/dfp/performance-logging';
import 'commercial/modules/messenger/get-stylesheet';
import 'commercial/modules/messenger/resize';
import 'commercial/modules/messenger/scroll';
import 'commercial/modules/messenger/viewport';
import 'commercial/modules/messenger/click';
import 'commercial/modules/messenger/background';
export default {
    init: init,
    customTiming: true
};

function init(moduleName) {

    function removeAdSlots() {
        bonzo(qwery(dfpEnv.adSlotSelector)).remove();
    }

    function moduleEnd() {
        performanceLogging.moduleEnd(moduleName);
    }

    function setupAdvertising() {
        // Use Custom Timing to time the googletag code without the sonobi pre-loading.
        performanceLogging.moduleStart(moduleName);

        return new Promise(function(resolve) {

            if (dfpEnv.sonobiEnabled) {
                // Just load googletag. Sonobi's wrapper will already be loaded, and googletag is already added to the window by sonobi.
                xxxrequirexxx(['js!googletag.js']);
                performanceLogging.addTag('sonobi');
            } else {
                xxxrequirexxx(['js!googletag.js']);
                performanceLogging.addTag('waterfall');
            }

            window.googletag.cmd.push = raven.wrap({
                deep: true
            }, window.googletag.cmd.push);

            window.googletag.cmd.push(
                setListeners,
                setPageTargeting,
                moduleEnd,
                resolve
            );
        });
    }

    if (commercialFeatures.dfpAdvertising) {
        return prepareSonobiTag.init().then(setupAdvertising).catch(function() {
            // A promise error here, from a failed module load,
            // could be a network problem or an intercepted request.
            // Abandon the init sequence.
            return fastdom.write(removeAdSlots);
        });
    }

    return fastdom.write(removeAdSlots);
}

function setListeners() {
    performanceLogging.setListeners(window.googletag);

    var pubads = window.googletag.pubads();
    pubads.addEventListener('slotRenderEnded', raven.wrap(onSlotRender));
    pubads.addEventListener('slotOnload', raven.wrap(onSlotLoad));
}

function setPageTargeting() {
    var pubads = window.googletag.pubads();
    var targeting = buildPageTargeting();
    Object.keys(targeting).forEach(function(key) {
        pubads.setTargeting(key, targeting[key]);
    });
}
