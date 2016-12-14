import once from 'lodash/functions/once';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import reportError from 'common/utils/report-error';
import userTiming from 'common/utils/user-timing';
import beacon from 'common/modules/analytics/beacon';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import Advert from 'commercial/modules/dfp/Advert';
import renderAdvert from 'commercial/modules/dfp/render-advert';
import emptyAdvert from 'commercial/modules/dfp/empty-advert';
import getAdvertById from 'commercial/modules/dfp/get-advert-by-id';
const recordFirstAdRendered = once(() => {
    beacon.beaconCounts('ad-render');
});

export default onSlotRender;

function onSlotRender(event) {
    dfpEnv.firstAdRendered = true;
    recordFirstAdRendered();

    const advert = getAdvertById(event.slot.getSlotElementId());
    Advert.stopLoading(advert, true);
    Advert.startRendering(advert);
    advert.isEmpty = event.isEmpty;

    if (event.isEmpty) {
        emptyAdvert(advert);
        reportEmptyResponse(advert.id, event);
        emitRenderEvents(false);
    } else {
        dfpEnv.creativeIDs.push(event.creativeId);
        renderAdvert(advert, event)
            .then(emitRenderEvents);
    }

    function emitRenderEvents(isRendered) {
        Advert.stopRendering(advert, isRendered);
        mediator.emit('modules:commercial:dfp:rendered', event);
        allAdsRendered();
    }
}

function reportEmptyResponse(adSlotId, event) {
    // This empty slot could be caused by a targeting problem,
    // let's report these and diagnose the problem in sentry.
    // Keep the sample rate low, otherwise we'll get rate-limited (report-error will also sample down)
    if (Math.random() < 0.0001) {
        const adUnitPath = event.slot.getAdUnitPath();
        const adTargetingMap = event.slot.getTargetingMap();
        const adTargetingKValues = adTargetingMap ? adTargetingMap.k : [];
        const adKeywords = adTargetingKValues ? adTargetingKValues.join(', ') : '';

        reportError(new Error('dfp returned an empty ad response'), {
            feature: 'commercial',
            adUnit: adUnitPath,
            adSlot: adSlotId,
            adKeywords,
        }, false);
    }
}

function allAdsRendered() {
    if (dfpEnv.adverts.every(_ => _.isRendered || _.isEmpty || _.isHidden)) {
        userTiming.mark('All ads are rendered');
        mediator.emit('modules:commercial:dfp:alladsrendered');
    }
}
