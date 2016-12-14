import fastdom from 'common/utils/fastdom-promise';
import config from 'common/utils/config';
import template from 'common/utils/template';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
import hostedThrasherStr from 'text!commercial/views/creatives/hosted-thrasher-multi.html';
let hostedThrasherTemplate;

const HostedThrasherMulti = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
};

HostedThrasherMulti.prototype.create = function () {
    hostedThrasherTemplate = template(hostedThrasherStr);

    return fastdom.write(function () {
        this.setAdditionalParams(this.params);

        this.$adSlot.append(hostedThrasherTemplate({
            data: this.params,
        }));
        if (this.params.trackingPixel) {
            addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
        }

        return true;
    }, this);
};

HostedThrasherMulti.prototype.setAdditionalParams = function () {
    for (let i = 1; i <= this.params.elementsNo; i++) {
        const videoLength = this.params[`videoLength${i}`];
        if (videoLength) {
            const seconds = videoLength % 60;
            const minutes = (videoLength - seconds) / 60;
            this.params[`timeString${i}`] = minutes + (seconds < 10 ? ':0' : ':') + seconds;
        }

        this.params[`linkTracking${i}`] = `${'Labs hosted container' +
            ' | '}${config.page.edition
            } | ${config.page.section
            } | ${this.params[`subHeader${i}`]
            } | ${this.params.sponsorName}`;
    }
};

export default HostedThrasherMulti;
