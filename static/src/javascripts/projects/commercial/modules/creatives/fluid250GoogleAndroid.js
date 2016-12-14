import bean from 'bean';
import bonzo from 'bonzo';
import Promise from 'Promise';
import $ from 'common/utils/$';
import mediator from 'common/utils/mediator';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import fluid250GoogleAndroidTpl from 'text!commercial/views/creatives/fluid250GoogleAndroid.html';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
const Fluid250GoogleAndroid = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
};

Fluid250GoogleAndroid.prototype.create = function () {
    $.create(template(fluid250GoogleAndroidTpl, this.params)).appendTo(this.$adSlot);

    if (this.params.trackingPixel) {
        addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
    }

    return Promise.resolve(true);
};

export default Fluid250GoogleAndroid;
