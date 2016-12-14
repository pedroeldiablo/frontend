import config from 'common/utils/config';
import fetchJson from 'common/utils/fetch-json';
import reportError from 'common/utils/report-error';
export default function () {
    const firstContainer = document.querySelector('.js-insert-team-stats-after');

    if (firstContainer) {
        fetchJson(`/${config.page.pageId}/fixtures-and-results-container`, {
            mode: 'cors',
        })
            .then((container) => {
                if (container.html) {
                    firstContainer.insertAdjacentHTML('afterend', container.html);
                }
            })
            .catch((ex) => {
                reportError(ex, {
                    feature: 'tag-fixtures',
                });
            });
    }
}
