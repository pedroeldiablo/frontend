import Promise from 'Promise';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import scrollableMpuTpl from 'text!commercial/views/creatives/scrollable-mpu-v2.html';
import trackingPixelStr from 'text!commercial/views/creatives/tracking-pixel.html';
import bindAll from 'lodash/functions/bindAll';

/**
 * https://www.google.com/dfp/59666047#delivery/CreateCreativeTemplate/creativeTemplateId=10026567
 */
const ScrollableMpu = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;

    bindAll(this, 'updateBgPosition');
};

/**
 * TODO: rather blunt instrument this, due to the fact *most* mobile devices don't have a fixed
 * background-attachment - need to make this more granular
 */
ScrollableMpu.hasScrollEnabled = !detect.isIOS() && !detect.isAndroid();

ScrollableMpu.prototype.updateBgPosition = function () {
    const that = this;

    switch (this.params.backgroundImagePType) {
        case 'fixed matching fluid250':
            fastdom.write(() => {
                $('.creative--scrollable-mpu-image', $(that.$adSlot)).addClass('creative--scrollable-mpu-image-fixed');
            });
            break;
        case 'parallax':
            this.scrollAmount = Math.ceil((window.pageYOffset - this.$adSlot.offset().top) * 0.3 * -1) + 20;
            this.scrollAmountP = `${this.scrollAmount}%`;
            fastdom.write(() => {
                $('.creative--scrollable-mpu-image', $(that.$adSlot)).addClass('creative--scrollable-mpu-image-parallax').css('background-position', `50%${that.scrollAmountP}`);
            });
            break;
        default:
            var position = window.pageYOffset - this.$scrollableMpu.offset().top;
            fastdom.write(() => {
                $('.creative--scrollable-mpu-image', $(that.$adSlot)).css('background-position', `100% ${position}px`);
            });
    }
};

ScrollableMpu.prototype.create = function () {
    const templateOptions = {
        clickMacro: this.params.clickMacro,
        destination: this.params.destination,
        layer1Image: ScrollableMpu.hasScrollEnabled ? this.params.layer1Image : this.params.mobileImage,
        backgroundImage: ScrollableMpu.hasScrollEnabled && this.params.backgroundImage ?
            `<div class="creative--scrollable-mpu-image" style="background-image: url(${this.params.backgroundImage});"></div>` : '',
        trackingPixelImg: this.params.trackingPixel ? template(trackingPixelStr, {
            url: encodeURI(this.params.trackingPixel),
        }) : '',
    };
    this.$scrollableMpu = $.create(template(scrollableMpuTpl, templateOptions)).appendTo(this.$adSlot);

    if (ScrollableMpu.hasScrollEnabled) {
        // update bg position
        fastdom.read(this.updateBgPosition);

        mediator.on('window:throttledScroll', this.updateBgPosition);
        // to be safe, also update on window resize
        mediator.on('window:resize', this.updateBgPosition);
    }

    return Promise.resolve(true);
};

export default ScrollableMpu;
