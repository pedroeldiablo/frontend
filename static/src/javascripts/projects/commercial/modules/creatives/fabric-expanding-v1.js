import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import fabricExpandingV1Html from 'text!commercial/views/creatives/fabric-expanding-v1.html';
import fabricExpandingVideoHtml from 'text!commercial/views/creatives/fabric-expanding-video.html';
import bindAll from 'lodash/functions/bindAll';
import merge from 'lodash/objects/merge';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
// Forked from expandable-v3.js

const FabricExpandingV1 = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
    this.isClosed = true;
    this.initialExpandCounter = false;

    this.closedHeight = 250;
    this.openedHeight = 500;

    bindAll(this, 'updateBgPosition', 'listener');
};

FabricExpandingV1.hasScrollEnabled = !detect.isIOS() && !detect.isAndroid();

FabricExpandingV1.prototype.updateBgPosition = function () {
    const that = this;

    const scrollY = window.pageYOffset;
    const viewportHeight = bonzo.viewport().height;
    const adSlotTop = this.$adSlot.offset().top;

    const adHeight = (this.isClosed) ? this.closedHeight : this.openedHeight;
    const inViewB = ((scrollY + viewportHeight) > adSlotTop);
    const inViewT = ((scrollY - (adHeight * 2)) < adSlotTop + 20);
    const topCusp = (inViewT &&
            ((scrollY + (viewportHeight * 0.4) - adHeight) > adSlotTop)) ?
        'true' : 'false';
    const bottomCusp = (inViewB &&
            (scrollY + (viewportHeight * 0.5)) < adSlotTop) ?
        'true' : 'false';
    const bottomScroll = (bottomCusp === 'true') ?
        50 - ((scrollY + (viewportHeight * 0.5) - adSlotTop) * -0.2) : 50;
    const topScroll = (topCusp === 'true') ?
        ((scrollY + (viewportHeight * 0.4) - adSlotTop - adHeight) * 0.2) : 0;

    let scrollAmount;

    switch (this.params.backgroundImagePType) {
        case 'split':
            scrollAmount = bottomScroll + topScroll;
            fastdom.write(() => {
                $('.ad-exp--expand-scrolling-bg', that.$adSlot).css({
                    'background-repeat': 'no-repeat',
                    'background-position': `50%${scrollAmount}%`,
                });
            });
            break;
        case 'fixed':
            scrollAmount = (scrollY - adSlotTop);
            fastdom.write(() => {
                $('.ad-exp--expand-scrolling-bg', that.$adSlot).css('background-position', `50%${scrollAmount}px`);
            });
            break;
        case 'fixed matching fluid250':
            fastdom.write(() => {
                $('.ad-exp--expand-scrolling-bg', that.$adSlot).addClass('ad-exp--expand-scrolling-bg-fixed');
            });
            break;
        case 'parallax':
            scrollAmount = Math.ceil((scrollY - adSlotTop) * 0.3 * -1) + 20;
            fastdom.write(() => {
                $('.ad-exp--expand-scrolling-bg', that.$adSlot).addClass('ad-exp--expand-scrolling-bg-parallax');
                $('.ad-exp--expand-scrolling-bg', that.$adSlot).css('background-position', `50%${scrollAmount}%`);
            });
            break;
        case 'none':
            break;
    }
};

FabricExpandingV1.prototype.listener = function () {
    const that = this;
    if (!this.initialExpandCounter && (window.pageYOffset + bonzo.viewport().height) > that.$adSlot.offset().top + this.openedHeight) {
        const itemId = $('.ad-slot__content', that.$adSlot).attr('id');
        const itemIdArray = itemId.split('/');

        if (!storage.local.get(`gu.commercial.expandable.${itemIdArray[1]}`)) {
            // expires in 1 week
            const week = 1000 * 60 * 60 * 24 * 7;
            fastdom.write(() => {
                storage.local.set(`gu.commercial.expandable.${itemIdArray[1]}`, true, {
                    expires: Date.now() + week,
                });
                that.$button.addClass('button-spin');
                $('.ad-exp__open-chevron').removeClass('chevron-up').addClass('chevron-down');
                that.$ad.css('height', that.openedHeight);
                that.isClosed = false;
                that.initialExpandCounter = true;
            });
        } else if (this.isClosed) {
            fastdom.write(() => {
                $('.ad-exp__open-chevron').addClass('chevron-up');
            });
        }
        return true;
    }
};

FabricExpandingV1.prototype.buildVideo = function (customClass) {
    const videoAspectRatio = 16 / 9;
    const videoHeight = detect.isBreakpoint({
        max: 'phablet',
    }) ? 125 : 250;
    const videoWidth = videoHeight * videoAspectRatio;
    const leftMargin = this.params.videoPositionH === 'center' ? `margin-left: ${videoWidth / -2}px` : '';
    const leftPosition = this.params.videoPositionH === 'left' ? `left: ${this.params.videoHorizSpace}px` : '';
    const rightPosition = this.params.videoPositionH === 'right' ? `right: ${this.params.videoHorizSpace}px` : '';

    const viewModel = {
        width: videoWidth,
        height: videoHeight,
        src: `${this.params.videoURL}?rel=0&amp;controls=0&amp;showinfo=0&amp;title=0&amp;byline=0&amp;portrait=0`,
        className: [
            'expandable_video',
            `expandable_video--horiz-pos-${this.params.videoPositionH}`,
            customClass,
        ].join(' '),
        inlineStyle: [leftMargin, leftPosition, rightPosition].join('; '),
    };

    return template(fabricExpandingVideoHtml, viewModel);
};

FabricExpandingV1.prototype.stopVideo = function (delay) {
    delay = delay || 0;

    const videoSelector = detect.isBreakpoint({
        min: 'tablet',
    }) ? '.js-fabric-video--desktop' : '.js-fabric-video--mobile';
    const video = $(videoSelector, this.$adSlot);
    const videoSrc = video.attr('src');

    window.setTimeout(() => {
        video.attr('src', `${videoSrc}&amp;autoplay=0`);
    }, delay);
};

FabricExpandingV1.prototype.create = function () {
    const hasVideo = this.params.videoURL !== '';
    const videoDesktop = {
        videoDesktop: hasVideo ? this.buildVideo('js-fabric-video--desktop') : '',
    };
    const videoMobile = {
        videoMobile: hasVideo ? this.buildVideo('js-fabric-video--mobile') : '',
    };
    const showmoreArrow = {
        showArrow: (this.params.showMoreType === 'arrow-only' || this.params.showMoreType === 'plus-and-arrow') ?
            `<button class="ad-exp__open-chevron ad-exp__open">${svgs('arrowdownicon')}</button>` : '',
    };
    const showmorePlus = {
        showPlus: (this.params.showMoreType === 'plus-only' || this.params.showMoreType === 'plus-and-arrow') ?
            `<button class="ad-exp__close-button ad-exp__open">${svgs('closeCentralIcon')}</button>` : '',
    };
    const scrollbgDefaultY = '0%'; // used if no parallax / fixed background scroll support
    const scrollingbg = {
        scrollbg: this.params.backgroundImagePType !== 'none' ?
            `<div class="ad-exp--expand-scrolling-bg" style="background-image: url(${this.params.backgroundImageP}); background-position: ${this.params.backgroundImagePPosition} ${scrollbgDefaultY}; background-repeat: ${this.params.backgroundImagePRepeat};"></div>` : '',
    };
    const $fabricExpandingV1 = $.create(template(fabricExpandingV1Html, {
        data: merge(this.params, showmoreArrow, showmorePlus, videoDesktop, videoMobile, scrollingbg),
    }));

    mediator.on('window:throttledScroll', this.listener);

    bean.on(this.$adSlot[0], 'click', '.ad-exp__open', () => {
        if (!this.isClosed && hasVideo) {
            // wait 1000ms for close animation to finish
            this.stopVideo(1000);
        }

        fastdom.write(() => {
            $('.ad-exp__close-button').toggleClass('button-spin');
            $('.ad-exp__open-chevron').removeClass('chevron-up').toggleClass('chevron-down');
            this.$ad.css('height', this.isClosed ? this.openedHeight : this.closedHeight);
            this.isClosed = !this.isClosed;
            this.initialExpandCounter = true;
        });
    });

    if (FabricExpandingV1.hasScrollEnabled) {
        // update bg position
        this.updateBgPosition();

        mediator.on('window:throttledScroll', this.updateBgPosition);
        // to be safe, also update on window resize
        mediator.on('window:resize', this.updateBgPosition);
    }

    return fastdom.write(function () {
        this.$ad = $('.ad-exp--expand', $fabricExpandingV1).css('height', this.closedHeight);
        this.$button = $('.ad-exp__open', $fabricExpandingV1);

        $('.ad-exp-collapse__slide', $fabricExpandingV1).css('height', this.closedHeight);

        if (this.params.trackingPixel) {
            addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
        }

        $fabricExpandingV1.appendTo(this.$adSlot);
        this.$adSlot.addClass('ad-slot--fabric');

        if (this.$adSlot.parent().hasClass('top-banner-ad-container')) {
            this.$adSlot.parent().addClass('top-banner-ad-container--fabric');
        }
        return true;
    }, this);
};

export default FabricExpandingV1;
