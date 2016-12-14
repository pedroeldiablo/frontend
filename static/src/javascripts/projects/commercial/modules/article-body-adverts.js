import Promise from 'Promise';
import qwery from 'qwery';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import steadyPage from 'common/utils/steady-page';
import spaceFiller from 'common/modules/article/space-filler';
import adSizes from 'common/modules/commercial/ad-sizes';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import memoize from 'lodash/functions/memoize';

/* bodyAds is a counter that keeps track of the number of inline MPUs
 * inserted dynamically. */
let bodyAds;
let inlineAd;
let replaceTopSlot;
let inlineMerchRules;
let longArticleRules;

function boot() {
    bodyAds = 0;
    inlineAd = 0;
    replaceTopSlot = detect.isBreakpoint({
        max: 'phablet',
    });
}

function getRules() {
    let prevSlot;
    return {
        bodySelector: '.js-article__body',
        slotSelector: ' > p',
        minAbove: detect.isBreakpoint({
            max: 'tablet',
        }) ? 300 : 700,
        minBelow: 300,
        selectors: {
            ' > h2': {
                minAbove: detect.getBreakpoint() === 'mobile' ? 100 : 0,
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
            if (!prevSlot || Math.abs(slot.top - prevSlot.top) - adSizes.mpu.height >= this.selectors[' .ad-slot'].minBelow) {
                prevSlot = slot;
                return true;
            }
            return false;
        },
    };
}

function getInlineMerchRules() {
    if (!inlineMerchRules) {
        inlineMerchRules = getRules();
        inlineMerchRules.minAbove = 300;
        inlineMerchRules.selectors[' > h2'].minAbove = 100;
        inlineMerchRules.selectors[' > :not(p):not(h2):not(.ad-slot)'].minAbove = 200;
    }
    return inlineMerchRules;
}

function getLongArticleRules() {
    if (!longArticleRules) {
        longArticleRules = getRules();
        longArticleRules.selectors[' .ad-slot'].minAbove =
            longArticleRules.selectors[' .ad-slot'].minBelow = detect.getViewport().height;
    }
    return longArticleRules;
}

function addInlineMerchAd(rules) {
    spaceFiller.fillSpace(rules, paras => insertAdAtPara(paras[0], 'im', 'im'), {
        waitForImages: true,
        waitForLinks: true,
        waitForInteractives: true,
        domWriter: detect.isBreakpoint({
            max: 'tablet',
        }) ? writerOverride : false,
    });
}

// Add new ads while there is still space
function addArticleAds(count, rules) {
    return spaceFiller.fillSpace(rules, insertInlineAds, {
        waitForImages: true,
        waitForLinks: true,
        waitForInteractives: true,
        domWriter: detect.isBreakpoint({
            max: 'tablet',
        }) ? writerOverride : false,
    });

    function insertInlineAds(paras) {
        let countAdded = 0;
        const insertionArr = [];
        while (countAdded < count && paras.length) {
            const para = paras.shift();
            let adDefinition;
            if (replaceTopSlot && bodyAds === 0) {
                adDefinition = 'top-above-nav';
            } else {
                inlineAd += 1;
                adDefinition = `inline${inlineAd}`;
            }
            insertionArr.push(insertAdAtPara(para, adDefinition, 'inline'));
            bodyAds += 1;
            countAdded += 1;
        }

        return Promise.all(insertionArr).then(() => countAdded);
    }
}

function insertAdAtPara(para, name, type) {
    const ad = createSlot(name, type);

    function insertion(ad, para) {
        para.parentNode.insertBefore(ad, para);
    }

    // If on mobile we will
    // insert ad using steady page
    // to avoid jumping the user
    if (detect.isBreakpoint({
        max: 'tablet',
    })) {
        return steadyPage.insert(ad, () => {
            insertion(ad, para);
        });
    } else {
        // If we're not on mobile we insert and resolve the promise immediately
        return new Promise((resolve) => {
            insertion(ad, para);
            resolve();
        });
    }
}

function addSlots(countAdded) {
    if (countAdded > 0) {
        qwery('.ad-slot--inline').forEach(addSlot);
    }
}

// If we're on mobile, we want to use steady-page right before dom insertion
// when we have the adslot so we provide a non-fastdom writer as
// fastdom is handled in steady-page
function writerOverride(writerCallback) {
    return writerCallback();
}

// If a merchandizing component has been rendered but is empty,
// we allow a second pass for regular inline ads. This is because of
// the decoupling between the spacefinder algorithm and the targeting
// in DFP: we can only know if a slot can be removed after we have
// received a response from DFP
const waitForMerch = memoize(() => trackAdRender('dfp-ad--im').then(isLoaded => isLoaded ? 0 : addArticleAds(2, getRules())).then(countAdded => countAdded === 2 ?
            addArticleAds(8, getLongArticleRules()).then(countAdded => 2 + countAdded) :
            countAdded));

const insertLongAds = memoize(() => addArticleAds(8, getLongArticleRules()).then(countAdded => 2 + countAdded));

function init() {
    if (!commercialFeatures.articleBodyAdverts) {
        return Promise.resolve(false);
    }

    const rules = getRules();

    boot();

    if (config.page.hasInlineMerchandise) {
        addInlineMerchAd(getInlineMerchRules());
    }

    return addArticleAds(2, rules).then((countAdded) => {
        if (config.page.hasInlineMerchandise && countAdded === 0) {
            waitForMerch().then(addSlots);
        } else if (countAdded === 2) {
            insertLongAds().then(addSlots);
        }
    });
}

export default {
    init,

    '@@tests': {
        waitForMerch,
        insertLongAds,
    },
};
