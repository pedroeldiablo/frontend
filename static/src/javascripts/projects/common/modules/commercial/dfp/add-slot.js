import mediator from 'common/utils/mediator';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import Advert from 'commercial/modules/dfp/Advert';
import queueAdvert from 'commercial/modules/dfp/queue-advert';
import loadAdvert from 'commercial/modules/dfp/load-advert';
import enableLazyLoad from 'commercial/modules/dfp/enable-lazy-load';
import performanceLogging from 'commercial/modules/dfp/performance-logging';
export default addSlot;

function addSlot(adSlot) {
    adSlot = adSlot instanceof HTMLElement ? adSlot : adSlot[0];

    if (dfpEnv.firstAdDisplayed && !(adSlot.id in dfpEnv.advertIds)) { // dynamically add ad slot
        // this is horrible, but if we do this before the initial ads have loaded things go awry
        if (dfpEnv.firstAdRendered) {
            displayAd(adSlot);
        } else {
            mediator.once('modules:commercial:dfp:rendered', function() {
                displayAd(adSlot);
            });
        }
    }
}

function displayAd(adSlot) {
    var advert = Advert(adSlot);

    dfpEnv.adverts.push(advert);
    queueAdvert(advert);
    if (dfpEnv.shouldLazyLoad()) {
        performanceLogging.updateAdvertMetric(advert, 'loadingMethod', 'add-slot-lazy');
        enableLazyLoad();
    } else {
        performanceLogging.updateAdvertMetric(advert, 'loadingMethod', 'add-slot-instant');
        performanceLogging.updateAdvertMetric(advert, 'lazyWaitComplete', 0);
        loadAdvert(advert);
    }
}
