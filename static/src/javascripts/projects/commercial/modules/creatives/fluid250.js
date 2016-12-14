import $ from 'qwery';
import bonzo from 'bonzo';
import Promise from 'Promise';
import fastdom from 'fastdom';
import detect from 'common/utils/detect';
import template from 'common/utils/template';
import mediator from 'common/utils/mediator';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
import fluid250Str from 'text!commercial/views/creatives/fluid250.html';
import iframeVideoStr from 'text!commercial/views/creatives/iframe-video.html';
import scrollBgStr from 'text!commercial/views/creatives/scrollbg.html';
import merge from 'lodash/objects/merge';
const hasScrollEnabled = !detect.isIOS() && !detect.isAndroid();
const isEnhanced = detect.isEnhanced();
const isIE9OrLess = detect.getUserAgent.browser === 'MSIE' && (detect.getUserAgent.version === '9' || detect.getUserAgent.version === '8');

let fluid250Tpl;
let iframeVideoTpl;
let scrollBgTpl;

const Fluid250 = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
};

Fluid250.prototype.create = function () {
    if (!fluid250Tpl) {
        fluid250Tpl = template(fluid250Str);
        iframeVideoTpl = template(iframeVideoStr);
        scrollBgTpl = template(scrollBgStr);
    }

    const position = {
        position: this.params.videoPositionH === 'left' || this.params.videoPositionH === 'right' ?
            `${this.params.videoPositionH}:${this.params.videoHorizSpace}px;` : '',
    };

    const templateOptions = {
        creativeHeight: this.params.creativeHeight || '',
        isFixedHeight: this.params.creativeHeight === 'fixed',
        showLabel: this.params.showAdLabel !== 'hide',
        video: this.params.videoURL ? iframeVideoTpl(merge(this.params, position)) : '',
        hasContainer: 'layerTwoAnimation' in this.params,
        layerTwoBGPosition: this.params.layerTwoBGPosition && (!this.params.layerTwoAnimation ||
                this.params.layerTwoAnimation === 'disabled' ||
                (!isEnhanced && this.params.layerTwoAnimation === 'enabled')
            ) ?
            this.params.layerTwoBGPosition : '0% 0%',
        scrollbg: this.params.backgroundImagePType && this.params.backgroundImagePType !== 'none' ?
            scrollBgTpl(this.params) : false,
    };

    this.$adSlot.append(fluid250Tpl({
        data: merge(this.params, templateOptions),
    }));
    if (templateOptions.scrollbg) {
        this.scrollingBg = $('.ad-scrolling-bg', this.$adSlot[0]);
        this.layer2 = $('.hide-until-tablet .fluid250_layer2', this.$adSlot[0]);

        if (hasScrollEnabled) {
            // update bg position
            fastdom.read(this.updateBgPosition, this);
            mediator.on('window:throttledScroll', this.updateBgPosition.bind(this));
            // to be safe, also update on window resize
            mediator.on('window:resize', this.updateBgPosition.bind(this));
        }
    }

    if (this.params.trackingPixel) {
        addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
    }

    return Promise.resolve(true);
};

Fluid250.prototype.updateBgPosition = function () {
    if (this.params.backgroundImagePType === 'parallax') {
        const scrollAmount = Math.ceil((window.pageYOffset - this.$adSlot.offset().top) * 0.3 * -1) + 20;
        fastdom.write(function () {
            bonzo(this.scrollingBg)
                .addClass('ad-scrolling-bg-parallax')
                .css('background-position', `50% ${scrollAmount}%`);
        }, this);
    }

    this.layer2Animation();
};

Fluid250.prototype.layer2Animation = function () {
    let inViewB;
    if (this.params.layerTwoAnimation === 'enabled' && isEnhanced && !isIE9OrLess) {
        inViewB = (window.pageYOffset + bonzo.viewport().height) > this.$adSlot.offset().top;
        fastdom.write(function () {
            bonzo(this.layer2).addClass(`ad-scrolling-text-hide${this.params.layerTwoAnimationPosition ? `-${this.params.layerTwoAnimationPosition}` : ''}`);
            if (inViewB) {
                bonzo(this.layer2).addClass(`ad-scrolling-text-animate${this.params.layerTwoAnimationPosition ? `-${this.params.layerTwoAnimationPosition}` : ''}`);
            }
        }, this);
    }
};

export default Fluid250;
