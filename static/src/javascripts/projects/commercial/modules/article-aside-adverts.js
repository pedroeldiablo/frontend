import Promise from 'Promise';
import $ from 'common/utils/$';
import $css from 'common/utils/$css';
import config from 'common/utils/config';
import fastdom from 'common/utils/fastdom-promise';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
const minArticleHeight = 1300;
const minFootballArticleHeight = 2200;
const minImmersiveArticleHeight = 600;

const mainColumnSelector = '.js-content-main-column';
const rhColumnSelector = '.js-secondary-column';
const adSlotContainerSelector = '.js-ad-slot-container';
const componentsContainerSelector = '.js-components-container';

function init() {
    const $col = $(rhColumnSelector);
    let $mainCol,
        $componentsContainer,
        $adSlotContainer;

    // are article aside ads disabled, or secondary column hidden?
    if (!(commercialFeatures.articleAsideAdverts && $col.length && $css($col, 'display') !== 'none')) {
        return Promise.resolve(false);
    }

    $mainCol = $(mainColumnSelector);
    $componentsContainer = $(componentsContainerSelector, $col[0]);
    $adSlotContainer = $(adSlotContainerSelector);

    return fastdom.read(() => $mainCol.dim().height).then((mainColHeight) => {
        let $adSlot,
            adType;


        if (config.page.isImmersive) {
            adType = mainColHeight >= minImmersiveArticleHeight ?
                'right' :
                'right-small';
        } else {
            adType = (config.page.section !== 'football' && mainColHeight >= minArticleHeight) ||
                (config.page.section === 'football' && mainColHeight >= minFootballArticleHeight) ? 'right-sticky' : 'right-small';
        }

        $adSlot = createSlot(adType, 'mpu-banner-ad');

        return fastdom.write(() => {
            if (config.page.contentType === 'Article' && config.page.sponsorshipType === 'advertisement-features') {
                $componentsContainer.addClass('u-h');
            }

            $adSlotContainer.append($adSlot);

            return $adSlotContainer;
        });
    });
}

export default {
    init,
};
