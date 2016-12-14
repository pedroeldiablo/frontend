import qwery from 'qwery';
import Promise from 'Promise';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import fastdom from 'common/utils/fastdom-promise';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import userPrefs from 'common/modules/user-prefs';
import commercialFeatures from 'common/modules/commercial/commercial-features';
const containerSelector = '.fc-container:not(.fc-container--commercial)';
const sliceSelector = '.js-fc-slice-mpu-candidate';
let isNetworkFront;

export default {
    init,
};

function init() {
    if (!commercialFeatures.sliceAdverts) {
        return Promise.resolve(false);
    }

    init.whenRendered = new Promise((resolve) => {
        mediator.once('page:commercial:slice-adverts', resolve);
    });

    const prefs = userPrefs.get('container-states') || {};
    const isMobile = detect.isBreakpoint({
        max: 'phablet',
    });

    isNetworkFront = ['uk', 'us', 'au'].indexOf(config.page.pageId) !== -1;

    // Get all containers
    const containers = qwery(containerSelector)
        // Filter out closed ones
        .filter(container => prefs[container.getAttribute('data-id')] !== 'closed');

    if (containers.length === 0) {
        return Promise.resolve(false);
    } else if (isMobile) {
        insertOnMobile(containers, getSlotNameOnMobile)
            .then(addSlots)
            .then(done);
    } else {
        insertOnDesktop(containers, getSlotNameOnDesktop)
            .then(addSlots)
            .then(done);
    }

    return Promise.resolve(true);
}

// On mobile, a slot is inserted after each container
function insertOnMobile(containers, getSlotName) {
    const hasThrasher = containers[0].classList.contains('fc-container--thrasher');
    let includeNext = false;
    let slots;

    // Remove first container if it is a thrasher
    containers = containers
        .slice(isNetworkFront && hasThrasher ? 1 : 0)
        // Filter every other container
        .filter((container) => {
            if (container.nextElementSibling && container.nextElementSibling.classList.contains('fc-container--commercial')) {
                return false;
            }

            includeNext = !includeNext;
            return includeNext;
        })
        // Keep as much as 10 of them
        .slice(0, 10);

    slots = containers
        .map((container, index) => {
        const adName = getSlotName(index);
        const classNames = ['container-inline', 'mobile'];
        let slot;
        let section;
        if (config.page.isAdvertisementFeature) {
            classNames.push('adfeature');
        }

        slot = createSlot(adName, classNames);

        // Wrap each ad slot in a SECTION element
        section = document.createElement('section');
        section.appendChild(slot);

        return section;
    });

    return fastdom.write(() => {
        slots.forEach((slot, index) => {
            containers[index].parentNode.insertBefore(slot, containers[index].nextSibling);
        });
        return slots.map(_ => _.firstChild);
    });
}

// On destkop, a slot is inserted when there is a slice available
function insertOnDesktop(containers, getSlotName) {
    let slots;

    // Remove first container on network fronts
    containers = containers.slice(isNetworkFront ? 1 : 0);

    slots = containers
        // get all ad slices
        .reduce((result, container) => {
            const slice = container.querySelector(sliceSelector);
            if (slice) {
                result.push(slice);
            }
            return result;
        }, [])
        // Keep a maximum of 10 containers
        .slice(0, 10)
        // create ad slots for the selected slices
        .map((slice, index) => {
            const adName = getSlotName(index);
            const classNames = ['container-inline'];
            let slot;

            if (config.page.isAdvertisementFeature) {
                classNames.push('adfeature');
            }

            slot = createSlot(adName, classNames);

            return {
                slice,
                slot,
            };
        });

    return fastdom.write(() => {
        slots.forEach((item) => {
            // add a tablet+ ad to the slice
            item.slice.classList.remove('fc-slice__item--no-mpu');
            item.slice.appendChild(item.slot);
        });
        return slots.map(_ => _.slot);
    });
}

function getSlotNameOnMobile(index) {
    return index === 0 ? 'top-above-nav' : `inline${index}`;
}

function getSlotNameOnDesktop(index) {
    return `inline${index + 1}`;
}

function addSlots(slots) {
    slots.forEach(addSlot);
}

function done() {
    mediator.emit('page:commercial:slice-adverts');
}
