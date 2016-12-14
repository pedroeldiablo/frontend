import Promise from 'Promise';
import qwery from 'qwery';
import stickyMpu from 'commercial/modules/sticky-mpu';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import fastdom from 'common/utils/fastdom-promise';
import spaceFiller from 'common/modules/article/space-filler';
import adSizes from 'common/modules/commercial/ad-sizes';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import mostPopular from 'common/modules/onward/geo-most-popular';
import memoize from 'lodash/functions/memoize';
/* We keep a handle on the main column to compute offsets afterwards */
const mainColumn = qwery('.js-content-main-column')[0];

/* We keep track of inline MPUs so that we can offset them to the right later */
let inlineSlots = [];

/* The promise resolves either when an inline merch slot has been added and
   a DFP call has returned, or directly if no inline slot has been added */
const waitForMerch = memoize(imSlot => imSlot ? trackAdRender('dfp-ad--im') : Promise.resolve(true));

/* bodyAds is a counter that keeps track of the number of inline MPUs
 * inserted dynamically. */
let bodyAds;

let isDesktop;
let isMobile;
let replaceTopSlot;
let getSlotName;

export default {
    init,

    '@@tests': {
        waitForMerch,
    },
};

function init() {
    if (!commercialFeatures.articleBodyAdverts) {
        return Promise.resolve(false);
    }

    boot();

    if (config.page.hasInlineMerchandise) {
        const im = addInlineMerchAd();
        im.then(waitForMerch).then(addInlineAds);
        return im;
    }

    addInlineAds();

    return Promise.resolve(true);
}

function boot() {
    bodyAds = 0;
    isDesktop = detect.isBreakpoint({
        min: 'desktop',
    });
    replaceTopSlot = isMobile = !isDesktop && detect.isBreakpoint({
        max: 'phablet',
    });
    getSlotName = replaceTopSlot ? getSlotNameForMobile : getSlotNameForDesktop;
}

function getSlotNameForMobile() {
    bodyAds += 1;
    return bodyAds === 1 ? 'top-above-nav' : `inline${bodyAds - 1}`;
}

function getSlotNameForDesktop() {
    bodyAds += 1;
    return `inline${bodyAds}`;
}

function getRules(isMerch) {
    let prevSlot;
    const rules = {
        bodySelector: '.js-article__body',
        slotSelector: ' > p',
        minAbove: isMobile ? 300 : config.page.hasShowcaseMainElement ? 900 : 700,
        minBelow: adSizes.mpu.height,
        selectors: {
            ' > h2': {
                minAbove: isMobile ? 100 : 0,
                minBelow: 250,
            },
            ' .ad-slot': {
                minAbove: 500,
                minBelow: 500,
            },
            ' > :not(p):not(h2):not(.ad-slot)': {
                minAbove: 35,
                minBelow: 400,
            },
        },
        filter(slot) {
            if (!prevSlot || Math.abs(slot.top - prevSlot.top) - adSizes.mpu.height >= rules.selectors[' .ad-slot'].minBelow) {
                prevSlot = slot;
                return true;
            }
            return false;
        },
    };

    if (!isMerch && isDesktop) {
        rules.minBelow = 100;
        rules.selectors = {
            ' .ad-slot': {
                minAbove: 500,
                minBelow: 500,
            },
        };
    }

    return rules;
}

function getInlineMerchRules() {
    const inlineMerchRules = getRules(true);
    inlineMerchRules.minAbove = 300;
    inlineMerchRules.selectors[' > h2'].minAbove = 100;
    inlineMerchRules.selectors[' > :not(p):not(h2):not(.ad-slot)'].minAbove = 200;
    return inlineMerchRules;
}

function getLongArticleRules() {
    const longArticleRules = getRules();
    longArticleRules.selectors[' .ad-slot'].minAbove =
        longArticleRules.selectors[' .ad-slot'].minBelow = Math.max(500, detect.getViewport().height);
    return longArticleRules;
}

// Add new ads while there is still space
function addArticleAds(count, rules) {
    return spaceFiller.fillSpace(rules, insertInlineAds, {
        waitForImages: true,
        waitForLinks: true,
        waitForInteractives: true,
    });

    function insertInlineAds(paras) {
        const slots = paras
            .slice(0, Math.min(paras.length, count))
            .map(para => insertAdAtPara(para, getSlotName(), 'inline'));

        if (isDesktop) {
            inlineSlots.push(...slots);
        }
    }
}

function insertAdAtPara(para, name, type) {
    const ad = createSlot(name, type);
    para.parentNode.insertBefore(ad, para);
    return ad;
}

function addSlots() {
    qwery('.js-ad-slot', mainColumn).forEach(addSlot);
}

function addInlineMerchAd() {
    return spaceFiller.fillSpace(getInlineMerchRules(), paras => insertAdAtPara(paras[0], 'im', 'im'), {
        waitForImages: true,
        waitForLinks: true,
        waitForInteractives: true,
    });
}

function addInlineAds() {
    return addArticleAds(2, getRules())
        .then(() => {
            if (inlineSlots.length === 2) {
                return addArticleAds(8, getLongArticleRules());
            }
        })
        .then(() => {
            if (isDesktop && inlineSlots.length) {
                offsetAds()
                    .then(() => {
                        // Prevent memory leak
                        inlineSlots = null;
                    });
            }
            addSlots();
        });
}

function offsetAds() {
    /* We want the height of the right-hand column, so we must wait for
       everything in it to be rendered */
    return Promise.all([
        stickyMpu.whenRendered,
        mostPopular.whenRendered,
    ])
        .then(() => fastdom.read(() => qwery('.js-secondary-column > *')
            .reduce((height, node) => height + node.offsetHeight, 0)))
        /* Next, we want to offset to the right all the inline slots *below*
           the components in the right-hand column */
        .then(rhHeight => fastdom.read(() => {
            const mainColumnOffset = mainColumn.getBoundingClientRect().top;
            let slotIndex = 0;
            while (slotIndex < inlineSlots.length) {
                const slotOffset = inlineSlots[slotIndex].getBoundingClientRect().top - mainColumnOffset;
                if (rhHeight < slotOffset) {
                    break;
                }
                slotIndex += 1;
            }
            return slotIndex;
        }))
        .then(slotIndex => fastdom.write(() => {
            inlineSlots.slice(slotIndex).forEach((slot) => {
                slot.classList.add('ad-slot--offset-right');
            });
        }));
}
