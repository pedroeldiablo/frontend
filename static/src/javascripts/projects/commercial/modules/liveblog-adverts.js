import bonzo from 'bonzo';
import fastdom from 'common/utils/fastdom-promise';
import detect from 'common/utils/detect';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import spaceFiller from 'common/modules/article/space-filler';
import Promise from 'Promise';
const INTERVAL = 5; // number of posts between ads
const OFFSET = 1.5; // ratio of the screen height from which ads are loaded
const MAX_ADS = 8; // maximum number of ads to display

let slotCounter = 0;
let isMobile;
let windowHeight;
let firstSlot;

function startListening() {
    mediator.on('modules:autoupdate:updates', onUpdate);
}

function stopListening() {
    mediator.off('modules:autoupdate:updates', onUpdate);
}

function getSpaceFillerRules(windowHeight, update) {
    let prevSlot;
    let prevIndex;
    update = !!update;
    return {
        bodySelector: '.js-liveblog-body',
        slotSelector: ' > .block',
        fromBottom: update,
        startAt: update ? firstSlot : null,
        absoluteMinAbove: update ? 0 : (windowHeight * OFFSET),
        minAbove: 0,
        minBelow: 0,
        filter: filterSlot,
    };

    function filterSlot(slot, index) {
        if (index === 0) {
            prevSlot = slot;
            prevIndex = index;
            return !update;
        } else if (index - prevIndex >= INTERVAL && Math.abs(slot.top - prevSlot.top) >= windowHeight) {
            prevSlot = slot;
            prevIndex = index;
            return true;
        }

        return false;
    }
}

function insertAds(slots) {
    for (let i = 0; i < slots.length && slotCounter < MAX_ADS; i++) {
        const slotName = isMobile && slotCounter === 0 ?
            'top-above-nav' : isMobile ?
            `inline${slotCounter}` :
            `inline${slotCounter + 1}`;
        const $adSlot = bonzo(createSlot(slotName, 'liveblog-inline block'));
        $adSlot.insertAfter(slots[i]);
        addSlot($adSlot);
        slotCounter += 1;
    }
}

function fill(rules) {
    return spaceFiller.fillSpace(rules, insertAds)
        .then((result) => {
            if (result && slotCounter < MAX_ADS) {
                firstSlot = document.querySelector(`${rules.bodySelector} > .ad-slot`).previousSibling;
                startListening();
            } else {
                firstSlot = null;
            }
        });
}

function onUpdate() {
    stopListening();
    Promise.resolve(getSpaceFillerRules(windowHeight, true)).then(fill);
}

function init() {
    if (!commercialFeatures.liveblogAdverts) {
        return Promise.resolve();
    }

    isMobile = detect.getBreakpoint() === 'mobile';

    return fastdom.read(() => windowHeight = document.documentElement.clientHeight)
        .then(getSpaceFillerRules)
        .then(fill);
}

export default {
    init,
};
