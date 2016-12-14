import bean from 'bean';
import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import assign from 'common/utils/assign';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import fabricExpandableVideoHtml from 'text!commercial/views/creatives/fabric-expandable-video-v2.html';
import fabricExpandableCtaHtml from 'text!commercial/views/creatives/fabric-expandable-video-v2-cta.html';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
export default FabricExpandableVideoV2;

function FabricExpandableVideoV2($adSlot, params) {
    let isClosed = true;
    const closedHeight = 250;
    const openedHeight = 500;

    const ctaTpl = template(fabricExpandableCtaHtml);

    return Object.freeze({
        create,
    });

    function create() {
        const videoHeight = openedHeight;
        const plusIconPosition = params.showCrossInContainer.substring(3);
        const additionalParams = {
            desktopCTA: params.ctaDesktopImage ? ctaTpl({
                media: 'hide-until-tablet',
                link: params.link,
                image: params.ctaDesktopImage,
                position: params.ctaDesktopPosition,
            }) : '',
            mobileCTA: params.ctaMobileImage ? ctaTpl({
                media: 'mobile-only',
                link: params.link,
                image: params.ctaMobileImage,
                position: params.ctaMobilePosition,
            }) : '',
            showArrow: (params.showMoreType === 'arrow-only' || params.showMoreType === 'plus-and-arrow') ?
                `<button class="ad-exp__open-chevron ad-exp__open">${svgs('arrowdownicon')}</button>` : '',
            showPlus: params.showMoreType === 'plus-only' || params.showMoreType === 'plus-and-arrow' ?
                `<button class="ad-exp__close-button ad-exp__open ad-exp__open--${plusIconPosition}">${svgs('closeCentralIcon')}</button>` : '',
            videoEmbed: (params.YoutubeVideoURL !== '') ?
                `<iframe id="YTPlayer" width="100%" height="${videoHeight}" src="${params.YoutubeVideoURL}?showinfo=0&amp;rel=0&amp;controls=0&amp;fs=0&amp;title=0&amp;byline=0&amp;portrait=0" frameborder="0" class="expandable-video"></iframe>` : '',
        };
        const $fabricExpandableVideo = $.create(template(fabricExpandableVideoHtml, {
            data: assign(params, additionalParams),
        }));
        const $ad = $('.ad-exp--expand', $fabricExpandableVideo);

        bean.on($adSlot[0], 'click', '.ad-exp__open', () => {
            fastdom.write(() => {
                open(isClosed);
            });
        });

        bean.on($adSlot[0], 'click', '.video-container__cta, .creative__cta', () => {
            fastdom.write(() => {
                open(false);
            });
        });

        return fastdom.write(() => {
            $ad.css('height', closedHeight);
            $('.ad-exp-collapse__slide', $fabricExpandableVideo).css('height', closedHeight);
            if (params.trackingPixel) {
                addTrackingPixel($adSlot, params.trackingPixel + params.cacheBuster);
            }
            $fabricExpandableVideo.appendTo($adSlot);
            $adSlot.addClass('ad-slot--fabric');
            if ($adSlot.parent().hasClass('top-banner-ad-container')) {
                $adSlot.parent().addClass('top-banner-ad-container--fabric');
            }
            return true;
        });

        function open(open) {
            const videoSrc = $('#YTPlayer').attr('src');
            let videoSrcAutoplay = videoSrc;

            if (videoSrc.indexOf('autoplay') === -1) {
                videoSrcAutoplay = `${videoSrc}&amp;autoplay=1`;
            } else {
                videoSrcAutoplay = videoSrcAutoplay.replace(
                    open ? 'autoplay=0' : 'autoplay=1',
                    open ? 'autoplay=1' : 'autoplay=0'
                );
            }

            if (open) {
                $('.ad-exp__close-button', $adSlot[0]).addClass('button-spin');
                $('.ad-exp__open-chevron', $adSlot[0]).addClass('chevron-down');
                $ad.css('height', openedHeight);
                $fabricExpandableVideo.addClass('creative--open');
                $('.slide-video, .slide-video .ad-exp__layer', $adSlot[0])
                    .css('height', openedHeight)
                    .addClass('slide-video__expand');
            } else {
                $('.ad-exp__close-button', $adSlot[0]).removeClass('button-spin');
                $('.ad-exp__open-chevron', $adSlot[0]).removeClass('chevron-down');
                $ad.css('height', closedHeight);
                $fabricExpandableVideo.removeClass('creative--open');
                $('.slide-video, .slide-video .ad-exp__layer', $adSlot[0])
                    .css('height', closedHeight)
                    .removeClass('slide-video__expand');
            }

            isClosed = !open;

            setTimeout(() => {
                $('#YTPlayer').attr('src', videoSrcAutoplay);
            }, 1000);
        }
    }
}
