import bonzo from 'bonzo';
import mediator from 'common/utils/mediator';
import fastdom from 'fastdom';
import filter from 'lodash/collections/filter';
import debounce from 'lodash/functions/debounce';

let items = [];

const scroll = {
    top: 0,
    bottom: 0,
};

let doProximityLoadingDebounced;

const doProximityLoading = () => {
    scroll.top = window.pageYOffset;
    scroll.bottom = scroll.top + bonzo.viewport().height;
    items = filter(items, (item) => {
        if (item.conditionFn()) {
            item.loadFn();
        } else {
            return true;
        }
    });
    if (items.length === 0) {
        mediator.off('window:throttledScroll', doProximityLoading);
    }
};

doProximityLoadingDebounced = debounce(doProximityLoading, 2000); // used on load for edge-case where user doesn't scroll

function addItem(conditionFn, loadFn) {
    // calls `loadFn` when `conditionFn` is true
    const item = {
        conditionFn,
        loadFn,
    };
    items.push(item);
    if (items.length === 1) {
        mediator.on('window:throttledScroll', doProximityLoading);
    }
    doProximityLoadingDebounced();
}

function addProximityLoader(el, distanceThreshold, loadFn) {
    // calls `loadFn` when screen is within `distanceThreshold` of `el`
    fastdom.read(() => {
        const $el = bonzo(el);

        const conditionFn = () => {
            let elOffset = $el.offset(),
                loadAfter = elOffset.top - distanceThreshold,
                loadBefore = elOffset.top + elOffset.height + distanceThreshold;
            return scroll.top > loadAfter && scroll.bottom < loadBefore;
        };

        addItem(conditionFn, loadFn);
    });
}

export default {
    add: addProximityLoader,
};
