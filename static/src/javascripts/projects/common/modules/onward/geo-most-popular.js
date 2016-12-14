/*
 Module: geo-most-popular.js
 Description: Shows popular trails for a given country.
 */
import Promise from 'Promise';
import qwery from 'qwery';
import Component from 'common/modules/component';
import ab from 'common/modules/experiments/ab';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import once from 'lodash/functions/once';

var promise = shouldRemoveGeoMostPop() ?
    Promise.resolve() :
    new Promise(function(resolve, reject) {
        mediator.on('modules:onward:geo-most-popular:ready', resolve);
        mediator.on('modules:onward:geo-most-popular:cancel', resolve);
        mediator.on('modules:onward:geo-most-popular:error', reject);
    });

function GeoMostPopular() {
    mediator.emit('register:begin', 'geo-most-popular');
}

Component.define(GeoMostPopular);

GeoMostPopular.prototype.endpoint = '/most-read-geo.json';

GeoMostPopular.prototype.ready = function() {
    mediator.emit('register:end', 'geo-most-popular');
    mediator.emit('modules:onward:geo-most-popular:ready', this);
};

GeoMostPopular.prototype.error = function(error) {
    mediator.emit('modules:onward:geo-most-popular:error', error);
};


function shouldRemoveGeoMostPop() {
    var testName = 'ItsRainingInlineAds';
    return !config.page.isImmersive && ab.testCanBeRun(testName) && ['nogeo', 'none'].indexOf(ab.getTestVariantId(testName)) > -1;
}

export default {

    render: once(function() {
        new GeoMostPopular().fetch(qwery('.js-components-container'), 'rightHtml');
        return promise;
    }),

    whenRendered: promise

};
