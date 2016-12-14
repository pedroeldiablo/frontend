import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import Component from 'common/modules/component';
import mediator from 'common/utils/mediator';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import ab from 'common/modules/experiments/ab';
import contains from 'lodash/collections/contains';

function MostPopular() {
    // This is not going to evolve into a random list of sections. If anyone wants more than these 2 then
    // they get to comission the work to have it go through the entire tooling chain so that a section has a
    // property that tells us whether it shows most popular or not.
    // Don't even come ask...
    const sectionsWithoutPopular = ['info', 'global'];
    mediator.emit('register:begin', 'popular-in-section');
    this.hasSection = config.page && config.page.section && !contains(sectionsWithoutPopular, config.page.section);
    this.endpoint = `/most-read${this.hasSection ? `/${config.page.section}` : ''}.json`;
    this.$mpu = null;
}

Component.define(MostPopular);

MostPopular.prototype.init = function () {
    this.fetch(qwery('.js-popular-trails'), 'html');
};

MostPopular.prototype.mobileMaximumSlotsReached = () => detect.getBreakpoint() === 'mobile' && $('.ad-slot--inline').length > 1;

MostPopular.prototype.prerender = function () {
    if (commercialFeatures.popularContentMPU && !this.mobileMaximumSlotsReached()) {
        const $mpuEl = $('.js-fc-slice-mpu-candidate', this.elem);
        this.$mpu = $mpuEl.append(createSlot('mostpop', 'container-inline'));
    }
};

MostPopular.prototype.ready = function () {
    if (this.$mpu) {
        addSlot($('.ad-slot', this.$mpu));
        this.$mpu.removeClass('fc-slice__item--no-mpu');
    }
    mediator.emit('modules:popular:loaded', this.elem);
    mediator.emit('page:new-content', this.elem);
    mediator.emit('register:end', 'popular-in-section');
};

export default MostPopular;
