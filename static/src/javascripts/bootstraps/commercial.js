import Promise from 'Promise';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import robust from 'common/utils/robust';
import userTiming from 'common/utils/user-timing';
import ab from 'common/modules/experiments/ab';
import articleAsideAdverts from 'commercial/modules/article-aside-adverts';
import articleBodyAdverts from 'commercial/modules/article-body-adverts';
import articleBodyAdvertsWide from 'commercial/modules/article-body-adverts-wide';
import closeDisabledSlots from 'commercial/modules/close-disabled-slots';
import prepareGoogletag from 'commercial/modules/dfp/prepare-googletag';
import prepareSonobiTag from 'commercial/modules/dfp/prepare-sonobi-tag';
import fillAdvertSlots from 'commercial/modules/dfp/fill-advert-slots';
import galleryAdverts from 'commercial/modules/gallery-adverts';
import hostedAbout from 'commercial/modules/hosted/about';
import hostedVideo from 'commercial/modules/hosted/video';
import hostedGallery from 'commercial/modules/hosted/gallery';
import hostedOJCarousel from 'commercial/modules/hosted/onward-journey-carousel';
import hostedOnward from 'commercial/modules/hosted/onward';
import sliceAdverts from 'commercial/modules/slice-adverts';
import liveblogAdverts from 'commercial/modules/liveblog-adverts';
import stickyTopBanner from 'commercial/modules/sticky-top-banner';
import thirdPartyTags from 'commercial/modules/third-party-tags';
import paidforBand from 'commercial/modules/paidfor-band';
import paidContainers from 'commercial/modules/paid-containers';
import performanceLogging from 'commercial/modules/dfp/performance-logging';
import ga from 'common/modules/analytics/google';
const primaryModules = [
    ['cm-thirdPartyTags', thirdPartyTags.init],
    ['cm-prepare-sonobi-tag', prepareSonobiTag.init],
    ['cm-prepare-googletag', prepareGoogletag.init, prepareGoogletag.customTiming],
    ['cm-articleAsideAdverts', articleAsideAdverts.init],
    ['cm-articleBodyAdverts', isItRainingAds() ? articleBodyAdvertsWide.init : articleBodyAdverts.init],
    ['cm-sliceAdverts', sliceAdverts.init],
    ['cm-galleryAdverts', galleryAdverts.init],
    ['cm-liveblogAdverts', liveblogAdverts.init],
    ['cm-closeDisabledSlots', closeDisabledSlots.init],
];

const secondaryModules = [
    ['cm-fill-advert-slots', fillAdvertSlots.init],
    ['cm-paidforBand', paidforBand.init],
    ['cm-paidContainers', paidContainers.init],
    ['cm-ready', () => {
        mediator.emit('page:commercial:ready');
        userTiming.mark('commercial end');
        robust.catchErrorsAndLog('ga-user-timing-commercial-end', () => {
            ga.trackPerformance('Javascript Load', 'commercialEnd', 'Commercial end parse time');
        });
        return Promise.resolve();
    }],
];

if (config.page.isHosted) {
    secondaryModules.unshift(
        ['cm-hostedAbout', hostedAbout.init], ['cm-hostedVideo', hostedVideo.init], ['cm-hostedGallery', hostedGallery.init], ['cm-hostedOnward', hostedOnward.init], ['cm-hostedOJCarousel', hostedOJCarousel.init]);
}

if ((config.switches.disableStickyAdBannerOnMobile && detect.getBreakpoint() === 'mobile') ||
    config.page.disableStickyTopBanner
) {
    config.page.hasStickyAdBanner = false;
} else {
    config.page.hasStickyAdBanner = true;
    secondaryModules.unshift(['cm-stickyTopBanner', stickyTopBanner.init]);
}

function loadModules(modules, baseline) {
    performanceLogging.addStartTimeBaseline(baseline);

    const modulePromises = [];

    modules.forEach((pair) => {
        const moduleName = pair[0];
        const moduleInit = pair[1];
        const hasCustomTiming = pair[2];

        robust.catchErrorsAndLog(moduleName, () => {
            const modulePromise = moduleInit(moduleName).then(() => {
                if (!hasCustomTiming) {
                    performanceLogging.moduleCheckpoint(moduleName, baseline);
                }
            });

            modulePromises.push(modulePromise);
        });
    });

    return Promise.all(modulePromises)
        .then((moduleLoadResult) => {
            performanceLogging.addEndTimeBaseline(baseline);
            return moduleLoadResult;
        });
}

function isItRainingAds() {
    const testName = 'ItsRainingInlineAds';
    return !config.page.isImmersive && ab.testCanBeRun(testName) && ['geo', 'nogeo'].indexOf(ab.getTestVariantId(testName)) > -1;
}

export default {
    init() {
        if (!config.switches.commercial) {
            return;
        }

        userTiming.mark('commercial start');
        robust.catchErrorsAndLog('ga-user-timing-commercial-start', () => {
            ga.trackPerformance('Javascript Load', 'commercialStart', 'Commercial start parse time');
        });

        // Stub the command queue
        window.googletag = {
            cmd: [],
        };

        loadModules(primaryModules, performanceLogging.primaryBaseline).then(() => {
            loadModules(secondaryModules, performanceLogging.secondaryBaseline);
        });
    },
};
