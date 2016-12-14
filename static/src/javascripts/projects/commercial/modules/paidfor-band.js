import fastdom from 'fastdom';
import Promise from 'Promise';
import config from 'common/utils/config';
import Sticky from 'common/modules/ui/sticky';

function init() {
    if (config.page.hasSuperStickyBanner) {
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        const elem = document.querySelector('.facia-page > .paidfor-band, #article > .paidfor-band');
        if (elem) {
            new Sticky(elem).init();
        }
        resolve();
    });
}

export default {
    init,
};
