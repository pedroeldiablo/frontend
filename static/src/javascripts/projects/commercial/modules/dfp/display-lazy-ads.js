import dfpEnv from 'commercial/modules/dfp/dfp-env';
import loadAdvert from 'commercial/modules/dfp/load-advert';
import enableLazyLoad from 'commercial/modules/dfp/enable-lazy-load';
import performanceLogging from 'commercial/modules/dfp/performance-logging';
const advertsToInstantlyLoad = [
    'dfp-ad--pageskin-inread',
    'dfp-ad--merchandising-high',
    'dfp-ad--im',
];

export default displayLazyAds;

function displayLazyAds() {
    window.googletag.pubads().collapseEmptyDivs();
    window.googletag.enableServices();
    instantLoad();
    enableLazyLoad();
}

function instantLoad() {
    const instantLoadAdverts = dfpEnv.advertsToLoad.filter((advert) => {
        if (advertsToInstantlyLoad.indexOf(advert.id) > -1) {
            performanceLogging.updateAdvertMetric(advert, 'loadingMethod', 'instant');
            performanceLogging.updateAdvertMetric(advert, 'lazyWaitComplete', 0);
            return true;
        } else {
            performanceLogging.updateAdvertMetric(advert, 'loadingMethod', 'lazy-load');
            return false;
        }
    });

    dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(advert => advertsToInstantlyLoad.indexOf(advert.id) < 0);

    instantLoadAdverts.forEach(loadAdvert);
}
