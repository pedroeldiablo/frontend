import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import fabricExpandableVideoHtml from 'text!commercial/views/creatives/fabric-expandable-video-v1.html';
import merge from 'lodash/objects/merge';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
// Forked from expandable-video-v2.js

const FabricExpandableVideoV1 = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
    this.isClosed = true;
    this.closedHeight = 250;
    this.openedHeight = 500;
};

FabricExpandableVideoV1.prototype.create = function () {
    const videoHeight = this.openedHeight;
    const showmoreArrow = {
        showArrow: (this.params.showMoreType === 'arrow-only' || this.params.showMoreType === 'plus-and-arrow') ?
            `<button class="ad-exp__open-chevron ad-exp__open">${svgs('arrowdownicon')}</button>` : '',
    };
    const showmorePlus = {
        showPlus: (this.params.showMoreType === 'plus-only' || this.params.showMoreType === 'plus-and-arrow') ?
            `<button class="ad-exp__close-button ad-exp__open">${svgs('closeCentralIcon')}</button>` : '',
    };
    const videoSource = {
        videoEmbed: (this.params.YoutubeVideoURL !== '') ?
            `<iframe id="YTPlayer" width="100%" height="${videoHeight}" src="${this.params.YoutubeVideoURL}?showinfo=0&amp;rel=0&amp;controls=0&amp;fs=0&amp;title=0&amp;byline=0&amp;portrait=0" frameborder="0" class="expandable-video"></iframe>` : '',
    };
    const $fabricExpandableVideo = $.create(template(fabricExpandableVideoHtml, {
        data: merge(this.params, showmoreArrow, showmorePlus, videoSource),
    }));
    const $ad = $('.ad-exp--expand', $fabricExpandableVideo);

    bean.on(this.$adSlot[0], 'click', '.ad-exp__open', () => {
        fastdom.write(() => {
            const videoSrc = $('#YTPlayer').attr('src');
            let videoSrcAutoplay = videoSrc;

            if (videoSrc.indexOf('autoplay') === -1) {
                videoSrcAutoplay = `${videoSrc}&amp;autoplay=1`;
            } else {
                videoSrcAutoplay = videoSrcAutoplay.replace(
                    this.isClosed ? 'autoplay=0' : 'autoplay=1',
                    this.isClosed ? 'autoplay=1' : 'autoplay=0'
                );
            }

            $('.ad-exp__close-button').toggleClass('button-spin');
            $('.ad-exp__open-chevron').removeClass('chevron-up').toggleClass('chevron-down');
            $ad.css(
                'height',
                this.isClosed ? this.openedHeight : this.closedHeight
            );
            $('.slide-video, .slide-video .ad-exp__layer', $(this.$adSlot[0]))
                .css('height', this.isClosed ? this.openedHeight : this.closedHeight)
                .toggleClass('slide-video__expand');

            this.isClosed = !this.isClosed;

            setTimeout(() => {
                $('#YTPlayer').attr('src', videoSrcAutoplay);
            }, 1000);
        });
    });

    return fastdom.write(function () {
        $ad.css('height', this.closedHeight);
        $('.ad-exp-collapse__slide', $fabricExpandableVideo).css('height', this.closedHeight);
        if (this.params.trackingPixel) {
            addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
        }
        $fabricExpandableVideo.appendTo(this.$adSlot);
        this.$adSlot.addClass('ad-slot--fabric');
        if (this.$adSlot.parent().hasClass('top-banner-ad-container')) {
            this.$adSlot.parent().addClass('top-banner-ad-container--fabric');
        }
        return true;
    }, this);
};

export default FabricExpandableVideoV1;
