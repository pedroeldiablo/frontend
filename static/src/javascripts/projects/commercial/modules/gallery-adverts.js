import qwery from 'qwery';
import detect from 'common/utils/detect';
import fastdom from 'common/utils/fastdom-promise';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import Promise from 'Promise';

export default {
    init,
};

function init() {
    if (!commercialFeatures.galleryAdverts) {
        return Promise.resolve(false);
    }

    const containerSelector = '.js-gallery-slot';
    let adContainers;
    const isMobile = detect.getBreakpoint() === 'mobile';
    const getSlotName = isMobile ? getSlotNameForMobile : getSlotNameForDesktop;
    const classNames = ['gallery-inline', 'dark'];

    if (isMobile) {
        classNames.push('mobile');
    }

    adContainers = qwery(containerSelector)

    .map((item, index) => {
        const adSlot = createSlot(getSlotName(index), classNames);

        return {
            anchor: item,
            adSlot,
        };
    });

    if (adContainers.length < 1) {
        return Promise.resolve(false);
    }

    return fastdom.write(() => {
        adContainers.forEach(insertSlot);

        function insertSlot(item) {
            item.anchor.appendChild(item.adSlot);
        }
    });
}

function getSlotNameForMobile(index) {
    return index === 0 ? 'top-above-nav' : `inline${index}`;
}

function getSlotNameForDesktop(index) {
    return `inline${index + 1}`;
}
