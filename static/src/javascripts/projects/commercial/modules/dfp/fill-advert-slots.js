import Promise from 'Promise';
import qwery from 'qwery';
import sha1 from 'common/utils/sha1';
import identity from 'common/modules/identity/api';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import Advert from 'commercial/modules/dfp/Advert';
import queueAdvert from 'commercial/modules/dfp/queue-advert';
import displayLazyAds from 'commercial/modules/dfp/display-lazy-ads';
import displayAds from 'commercial/modules/dfp/display-ads';
import refreshOnResize from 'commercial/modules/dfp/refresh-on-resize';

function init() {
    if (commercialFeatures.dfpAdvertising) {
        return fillAdvertSlots();
    }
    return Promise.resolve();
}

function fillAdvertSlots() {
    return new Promise((resolve) => {
        window.googletag.cmd.push(
            createAdverts,
            queueAdverts,
            setPublisherProvidedId,
            dfpEnv.shouldLazyLoad() ? displayLazyAds : displayAds,
            // anything we want to happen after displaying ads
            refreshOnResize,
            resolve);
    });
}

function createAdverts() {
    // Get all ad slots
    dfpEnv.adverts = qwery(dfpEnv.adSlotSelector).map(Advert);
}

/**
 * Loop through each slot detected on the page and define it based on the data
 * attributes on the element.
 */
function queueAdverts() {
    // queue ads for load
    dfpEnv.adverts.forEach(queueAdvert);
}

function setPublisherProvidedId() {
    const user = identity.getUserFromCookie();
    if (user) {
        const hashedId = sha1.hash(user.id);
        window.googletag.pubads().setPublisherProvidedId(hashedId);
    }
}

export default {
    init,
};
