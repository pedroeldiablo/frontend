import qwery from 'qwery';
import bonzo from 'bonzo';
import addEventListener from 'common/utils/add-event-listener';
import fastdom from 'common/utils/fastdom-promise';
import detect from 'common/utils/detect';
import template from 'common/utils/template';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
import fabricVideoStr from 'text!commercial/views/creatives/fabric-video.html';
let fabricVideoTpl;

export default FabricVideo;

function FabricVideo(adSlot, params) {
    let isUpdating = false;
    const isSmallScreen = detect.isBreakpoint({
        max: 'phablet',
    });
    let hasVideo,
        video,
        layer2,
        inView;

    adSlot = adSlot instanceof HTMLElement ? adSlot : adSlot[0];
    fabricVideoTpl || (fabricVideoTpl = template(fabricVideoStr));

    hasVideo = !(detect.isIOS() || detect.isAndroid() || isSmallScreen);

    if (isSmallScreen) {
        params.posterMobile = `<div class="creative__poster" style="background-image:url(${params.Videobackupimage})"></div>`;
    } else {
        if (hasVideo) {
            params.video = `<video muted class="creative__video creative__video--${params.Videoalignment}"><source src="${params.VideoURL}" type="video/mp4"></video>`;
        }

        params.posterTablet = `<div class="creative__poster" style="background-image:url(${params.BackgroundImagemobile})"></div>`;
    }

    return Object.freeze({
        create,
    });

    function create() {
        return fastdom.write(() => {
            if (params.Trackingpixel) {
                addTrackingPixel(bonzo(adSlot), params.Trackingpixel + params.cacheBuster);
            }
            adSlot.insertAdjacentHTML('beforeend', fabricVideoTpl({
                data: params,
            }));
            adSlot.classList.add('ad-slot--fabric');
            if (adSlot.parentNode.classList.contains('top-banner-ad-container')) {
                adSlot.parentNode.classList.add('top-banner-ad-container--fabric');
            }
        }).then(() => {
            layer2 = qwery('.creative__layer2', adSlot);

            addEventListener(window, 'scroll', onScroll, {
                passive: true,
            });
            addEventListener(adSlot, 'animationend', () => {
                window.removeEventListener('scroll', onScroll);
            });

            if (hasVideo) {
                video = adSlot.getElementsByTagName('video')[0];
                video.onended = onVideoEnded;
            }

            fastdom.read(onScroll);

            return true;
        });
    }

    function onVideoEnded() {
        video.onended = null;
        video = null;
    }

    function onScroll() {
        const viewportHeight = detect.getViewport().height;
        const rect = adSlot.getBoundingClientRect();
        inView = rect.top >= 0 && rect.bottom < viewportHeight;
        if (!isUpdating) {
            isUpdating = true;
            fastdom.write(updateView);
        }
    }

    function updateView() {
        isUpdating = false;
        if (video) {
            updateVideo();
        }
        updateAnimation();
    }

    function updateVideo() {
        if (inView) {
            video.play();
        } else {
            video.pause();
        }
    }

    function updateAnimation() {
        if (inView) {
            playAnimation();
        } else {
            pauseAnimation();
        }
    }

    function playAnimation() {
        layer2.forEach((l) => {
            l.classList.add('is-animating');
        });
    }

    function pauseAnimation() {
        layer2.forEach((l) => {
            l.classList.remove('is-animating');
        });
    }
}
