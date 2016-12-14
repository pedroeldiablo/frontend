import bonzo from 'bonzo';
import qwery from 'qwery';
import Promise from 'Promise';
import $css from 'common/utils/$css';
import fastdom from 'common/utils/fastdom-promise';
import commercialFeatures from 'common/modules/commercial/commercial-features';
var adSlotSelector = '.js-ad-slot';

export default {
    init: init
};

function init() {

    var modulePromises = [];

    // Get all ad slots
    qwery(adSlotSelector)
        // convert them to bonzo objects
        .map(bonzo)
        // remove the ones which should not be there
        .filter(function($adSlot) {
            // filter out (and remove) hidden ads
            return shouldDisableAdSlot($adSlot);
        })
        .forEach(function($adSlot) {
            modulePromises.push(
                fastdom.write(function() {
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
