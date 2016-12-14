import fastdom from 'common/utils/fastdom-promise';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import Toggles from 'common/modules/ui/toggles';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
import frameStr from 'text!commercial/views/creatives/frame.html';
import labelStr from 'text!commercial/views/creatives/gustyle-label.html';

const Frame = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
};

Frame.prototype.create = function () {
    this.params.externalLinkIcon = svgs('externalLink', ['gu-external-icon']);
    this.params.target = this.params.newWindow === 'yes' ? '_blank' : '_self';

    const frameMarkup = template(frameStr, {
        data: this.params,
    });
    const labelMarkup = template(labelStr, {
        data: {
            buttonTitle: 'Ad',
            infoTitle: 'Advertising on the Guardian',
            infoText: 'is created and paid for by third parties.',
            infoLinkText: 'Learn more about how advertising supports the Guardian.',
            infoLinkUrl: 'https://www.theguardian.com/advertising-on-the-guardian',
            icon: svgs('arrowicon', ['gu-comlabel__icon']),
            dataAttr: this.$adSlot[0].id,
        },
    });
    return fastdom.write(function () {
        this.$adSlot[0].insertAdjacentHTML('beforeend', frameMarkup);
        this.$adSlot[0].lastElementChild.insertAdjacentHTML('afterbegin', labelMarkup);
        this.$adSlot.addClass('ad-slot--frame');
        if (this.params.trackingPixel) {
            addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
        }
        new Toggles(this.$adSlot[0]).init();
        return true;
    }, this);
};

export default Frame;
