import assign from 'common/utils/assign';
import closest from 'common/utils/closest';
import fastdom from 'common/utils/fastdom-promise';
import messenger from 'commercial/modules/messenger';
messenger.register('resize', (specs, ret, iframe) => resize(specs, iframe, closest(iframe, '.js-ad-slot')));

export default resize;

function resize(specs, iframe, adSlot) {
    if (!specs || !('height' in specs || 'width' in specs)) {
        return null;
    }

    const styles = {};

    if ('width' in specs) {
        styles.width = normalise(specs.width);
    }

    if ('height' in specs) {
        styles.height = normalise(specs.height);
    }

    return fastdom.write(() => {
        assign(adSlot.style, styles);
        assign(iframe.style, styles);
    });
}

function normalise(length) {
    const lengthRegexp = /^(\d+)(%|px|em|ex|ch|rem|vh|vw|vmin|vmax)?/;
    const defaultUnit = 'px';
    const matches = String(length).match(lengthRegexp);
    if (!matches) {
        return null;
    }
    return matches[1] + (matches[2] === undefined ? defaultUnit : matches[2]);
}
