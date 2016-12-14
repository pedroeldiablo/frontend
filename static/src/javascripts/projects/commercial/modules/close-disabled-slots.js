import bonzo from 'bonzo';
import qwery from 'qwery';
import Promise from 'Promise';
import $css from 'common/utils/$css';
import fastdom from 'common/utils/fastdom-promise';
import commercialFeatures from 'common/modules/commercial/commercial-features';
const adSlotSelector = '.js-ad-slot';

export default {
    init,
};

function init() {
    const modulePromises = [];

    // Get all ad slots
    qwery(adSlotSelector)
        // convert them to bonzo objects
        .map(bonzo)
        // remove the ones which should not be there
        .filter($adSlot =>
            // filter out (and remove) hidden ads
             shouldDisableAdSlot($adSlot))
        .forEach(($adSlot) => {
            modulePromises.push(
                fastdom.write(() => {
                    $adSlot.remove();
                })
            );
        });

    return Promise.all(modulePromises);
}

function shouldDisableAdSlot($adSlot) {
    return isVisuallyHidden() || isDisabledCommercialFeature();

    function isVisuallyHidden() {
        return $css($adSlot, 'display') === 'none';
    }

    function isDisabledCommercialFeature() {
        return !commercialFeatures.topBannerAd && $adSlot.data('name') === 'top-above-nav';
    }
}
