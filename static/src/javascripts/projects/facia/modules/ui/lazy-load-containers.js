import bonzo from 'bonzo';
import fastdom from 'fastdom';
import qwery from 'qwery';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import throttle from 'lodash/functions/throttle';
var distanceBeforeLoad = detect.getViewport().height;

export default function() {
    var $frontBottom = bonzo(qwery('.js-front-bottom')),
        containers = qwery('.js-container--lazy-load'),
        lazyLoad = throttle(function() {
            if (containers.length === 0) {
                mediator.off('window:throttledScroll', lazyLoad);
            } else {
                fastdom.read(function() {
                    var scrollTop = window.pageYOffset,
                        scrollBottom = scrollTop + bonzo.viewport().height,
                        bottomOffset = $frontBottom.offset().top,
                        $container;

                    if (scrollBottom > bottomOffset - distanceBeforeLoad) {
                        $container = bonzo(containers.shift());

                        fastdom.write(function() {
                            $container.removeClass('fc-container--lazy-load');
                        });
                    }
                });
            }
        }, 500);

    mediator.on('window:throttledScroll', lazyLoad);
    lazyLoad();
};
