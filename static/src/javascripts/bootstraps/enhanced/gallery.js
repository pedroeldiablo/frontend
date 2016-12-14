import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import Component from 'common/modules/component';
import trail from 'bootstraps/enhanced/trail';
import debounce from 'lodash/functions/debounce';
let verticallyResponsiveImages = function () {
        const setHeight = function () {
            if (!bonzo(document.body).hasClass('has-overlay')) {
                let $imgs = $('.js-gallery-img'),
                    min = 300, // stops images getting too small
                    max = $imgs.parent().dim().width, // portrait images shouldn't be taller than landscapes are wide
                    height = Math.max(min, Math.min(max, window.innerHeight * 0.9));
                $imgs.css('max-height', height);

                // Portrait containers use padding-bottom to set the height of the container prior to upgrading.
                // This needs to be synchronised with the new image height.
                $('.gallery2__img-container--portrait').css('padding-bottom', height);
            }
        };

        setHeight();
        mediator.addListeners({
            'window:resize': debounce(setHeight, 200),
            'window:orientationchange': debounce(setHeight, 200),
            'ui:images:vh': setHeight,
        });
    },
    transcludeMostPopular = function () {
        let mostViewed = new Component(),
            container = qwery('.js-gallery-most-popular')[0];

        mostViewed.manipulationType = 'html';
        mostViewed.endpoint = '/gallery/most-viewed.json';
        mostViewed.ready = function () {
            mediator.emit('page:new-content', container);
        };
        mostViewed.fetch(container, 'html');
    },
    ready = function () {
        trail();
        verticallyResponsiveImages();

        mediator.emit('ui:images:upgradePictures');

        mediator.emit('page:gallery:ready');
        if (config.page.showRelatedContent) {
            transcludeMostPopular();
        }
    };

export default {
    init: ready,
};
