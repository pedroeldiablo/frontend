import config from 'common/utils/config';
import proximityLoader from 'common/utils/proximity-loader';
import Series from 'common/modules/onward/onward-content';
export default function () {
    const el = document.getElementsByClassName('js-onward');

    if (el.length > 0) {
        proximityLoader.add(el[0], 1500, () => {
            if (config.page.seriesId && config.page.showRelatedContent) {
                new Series(document.getElementsByClassName('js-onward'));
            }
        });
    }
}
