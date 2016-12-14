import config from 'common/utils/config';
import ajax from 'common/utils/ajax';
import map from 'lodash/collections/map';
import isArray from 'lodash/objects/isArray';
const canBeacon = !!navigator.sendBeacon;

function buildCounts(keys) {
    return map(isArray(keys) ? keys : [keys], key => `c=${key}`).join('&');
}

// note, support is reasonably limited https://developer.mozilla.org/en-US/docs/Web/API/navigator.sendBeacon
function beaconCounts(keys) {
    let url;
    if (canBeacon) {
        url = `${config.page.beaconUrl}/accept-beacon?${buildCounts(keys)}`;
        return navigator.sendBeacon(url, '');
    }
}

export default {
    fire(path) {
        const img = new Image();
        img.src = config.page.beaconUrl + path;

        return img;
    },
    postJson(path, jsonString, forceAjax) {
        const url = (config.page.beaconUrl || '').replace(/^\/\//, `${window.location.protocol}//`) + path;

        if (canBeacon && !forceAjax) {
            window.addEventListener('unload', () => {
                navigator.sendBeacon(url, jsonString);
            }, false);
        } else {
            ajax({
                url,
                type: 'json',
                method: 'post',
                contentType: 'application/json',
                data: jsonString,
                crossOrigin: true,
            });
        }
    },
    counts(keys) {
        if (canBeacon) {
            return beaconCounts(keys);
        } else {
            const query = buildCounts(keys);
            return this.fire(`/counts.gif?${query}`);
        }
    },

    beaconCounts,
};
