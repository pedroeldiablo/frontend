import urlUtils from 'common/utils/url';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import uniq from 'lodash/arrays/uniq';
import flatten from 'lodash/arrays/flatten';
export default defineSlot;

function defineSlot(adSlotNode, sizes) {
    const slotTarget = adSlotNode.getAttribute('data-slot-target') || adSlotNode.getAttribute('data-name');
    const adUnitOverride = urlUtils.getUrlVars()['ad-unit'];
    // if ?ad-unit=x, use that
    const adUnit = adUnitOverride ?
        `/${config.page.dfpAccountId}/${adUnitOverride}` :
        config.page.adUnit;
    const sizeOpts = getSizeOpts(sizes);
    const id = adSlotNode.id;
    let slot;

    if (adSlotNode.getAttribute('data-out-of-page')) {
        slot = window.googletag.defineOutOfPageSlot(adUnit, id).defineSizeMapping(sizeOpts.sizeMapping);
    } else {
        slot = window.googletag.defineSlot(adUnit, sizeOpts.size, id).defineSizeMapping(sizeOpts.sizeMapping);
    }

    setTargeting(adSlotNode, slot, 'data-series', 'se');
    setTargeting(adSlotNode, slot, 'data-keywords', 'k');

    slot.addService(window.googletag.pubads())
        .setTargeting('slot', slotTarget);

    return slot;
}

function getSizeOpts(sizes) {
    const sizeMapping = buildSizeMapping(sizes);
    // as we're using sizeMapping, pull out all the ad sizes, as an array of arrays
    const size = uniq(
        flatten(sizeMapping, true, map => map[1]),
        size => `${size[0]}-${size[1]}`
    );

    return {
        sizeMapping,
        size,
    };
}

function setTargeting(adSlotNode, slot, attribute, targetKey) {
    const data = adSlotNode.getAttribute(attribute);
    if (data) {
        slot.setTargeting(targetKey, parseKeywords(data));
    }
}

function parseKeywords(keywords) {
    return (keywords || '').split(',').map(keyword => keyword.substr(keyword.lastIndexOf('/') + 1));
}

/**
 * Builds and assigns the correct size map for a slot based on the breakpoints
 * attached to the element via data attributes.
 *
 * A new size map is created for a given slot. We then loop through each breakpoint
 * defined in the config, checking if that breakpoint has been set on the slot.
 *
 * If it has been defined, then we add that size to the size mapping.
 *
 */
function buildSizeMapping(sizes) {
    const mapping = window.googletag.sizeMapping();

    detect.breakpoints
        .filter(_ => _.name in sizes)
        .forEach((_) => {
            mapping.addSize([_.width, 0], sizes[_.name]);
        });

    return mapping.build();
}
