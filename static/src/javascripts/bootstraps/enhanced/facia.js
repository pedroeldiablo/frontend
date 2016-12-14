import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import robust from 'common/utils/robust';
import storage from 'common/utils/storage';
import toArray from 'common/utils/to-array';
import accessibility from 'common/modules/accessibility/helpers';
import ab from 'common/modules/experiments/ab';
import stocks from 'common/modules/business/stocks';
import GeoMostPopularFront from 'facia/modules/onwards/geo-most-popular-front';
import ContainerToggle from 'facia/modules/ui/container-toggle';
import containerShowMore from 'facia/modules/ui/container-show-more';
import lazyLoadContainers from 'facia/modules/ui/lazy-load-containers';
import liveblogUpdates from 'facia/modules/ui/live-blog-updates';
import snaps from 'facia/modules/ui/snaps';
import sponsorship from 'facia/modules/ui/sponsorship';
import weather from 'facia/modules/onwards/weather';
import partial from 'lodash/functions/partial';
import forEach from 'lodash/collections/forEach';

const modules = {
    showSnaps() {
        snaps.init();
        mediator.on('modules:container:rendered', snaps.init);
    },

    showContainerShowMore() {
        mediator.addListeners({
            'modules:container:rendered': containerShowMore.init,
            'page:front:ready': containerShowMore.init,
        });
    },

    showContainerToggle() {
        const containerToggleAdd = (context) => {
            $('.js-container--toggle', $(context || document)[0]).each((container) => {
                new ContainerToggle(container).addToggle();
            });
        };
        mediator.addListeners({
            'page:front:ready': containerToggleAdd,
            'modules:geomostpopular:ready': partial(containerToggleAdd, '.js-popular-trails'),
        });
    },

    upgradeMostPopularToGeo() {
        if (config.switches.geoMostPopular) {
            new GeoMostPopularFront().go();
        }
    },

    showWeather() {
        if (config.switches.weather) {
            mediator.on('page:front:ready', () => {
                weather.init();
            });
        }
    },

    showLiveblogUpdates() {
        if (detect.isBreakpoint({
            min: 'desktop',
        })) {
            mediator.on('page:front:ready', () => {
                liveblogUpdates.show();
            });
        }
    },

    finished() {
        mediator.emit('page:front:ready');
    },

};

const ready = () => {
    forEach(robust.makeBlocks([
        ['f-accessibility', accessibility.shouldHideFlashingElements],
        ['f-snaps', modules.showSnaps],
        ['f-show-more', modules.showContainerShowMore],
        ['f-container-toggle', modules.showContainerToggle],
        ['f-geo-most-popular', modules.upgradeMostPopularToGeo],
        ['f-lazy-load-containers', lazyLoadContainers],
        ['f-stocks', stocks],
        ['f-sponsorship', sponsorship],
        ['f-weather', modules.showWeather],
        ['f-live-blog-updates', modules.showLiveblogUpdates],
        ['f-finished', modules.finished],
    ]), (fn) => {
        fn();
    });
};

export default {
    init: ready,
};
