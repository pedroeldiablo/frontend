import config from 'common/utils/config';
import fetchJson from 'common/utils/fetch-json';
import fastdom from 'common/utils/fastdom-promise';
import HostedCarousel from 'commercial/modules/hosted/onward-journey-carousel';
import Promise from 'Promise';

export default {
    init: loadOnwardComponent,
};

function loadOnwardComponent() {
    const placeholders = document.querySelectorAll('.js-onward-placeholder');

    if (placeholders.length) {
        return fetchJson(`${config.page.ajaxUrl}/${config.page.pageId}/${config.page.contentType.toLowerCase()}/` + 'onward.json', {
            mode: 'cors',
        })
            .then(json => fastdom.write(() => {
                let i;
                for (i = 0; i < placeholders.length; i++) {
                    placeholders[i].innerHTML = json.html;
                }
                new HostedCarousel.init();
            }));
    }
    return Promise.resolve();
}
