import qwery from 'qwery';
import bean from 'bean';
import Promise from 'Promise';
import fastdom from 'common/utils/fastdom-promise';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import memoize from 'lodash/functions/memoize';
// total_hours_spent_maintaining_this = 64
//
// maximum time (in ms) to wait for images to be loaded and rich links
// to be upgraded
const LOADING_TIMEOUT = 5000;

// find spaces in articles for inserting ads and other inline content
// minAbove and minBelow are measured in px from the top of the paragraph element being tested
const defaultRules = { // these are written for adverts
    bodySelector: '.js-article__body',
    slotSelector: ' > p',
    absoluteMinAbove: 0, // minimum from slot to top of page
    minAbove: 250, // minimum from para to top of article
    minBelow: 300, // minimum from (top of) para to bottom of article
    clearContentMeta: 50, // vertical px to clear the content meta element (byline etc) by. 0 to ignore
    selectors: { // custom rules using selectors. format:
        // '.selector': {
        //   minAbove: <min px above para to bottom of els matching selector>,
        //   minBelow: <min px below (top of) para to top of els matching selector> }
        ' > h2': {
            minAbove: 0,
            minBelow: 250,
        }, // hug h2s
        ' > *:not(p):not(h2)': {
            minAbove: 25,
            minBelow: 250,
        }, // require spacing for all other elements
    },

    // filter:(slot:Element, index:Integer, slots:Collection<Element>) -> Boolean
    // will run each slot through this fn to check if it must be counted in
    filter: null,

    // startAt:Element
    // will remove slots before this one
    startAt: null,

    // stopAt:Element
    // will remove slots from this one on
    stopAt: null,

    // fromBotton:Boolean
    // will reverse the order of slots (this is useful for lazy loaded content)
    fromBottom: false,
};

const defaultOptions = {
    waitForImages: true,
    waitForLinks: true,
    waitForInteractives: false,
    waitForAds: false,
};

function expire(resolve) {
    window.setTimeout(resolve, LOADING_TIMEOUT);
}

function getFuncId(rules) {
    return rules.bodySelector || 'document';
}

const onImagesLoaded = memoize((rules) => {
    let notLoaded = qwery('img', rules.body).filter(img => !img.complete);

    return notLoaded.length === 0 ?
        true :
        new Promise((resolve) => {
            let loadedCount = 0;
            bean.on(rules.body, 'load', notLoaded, function onImgLoaded() {
                loadedCount += 1;
                if (loadedCount === notLoaded.length) {
                    bean.off(rules.body, 'load', onImgLoaded);
                    notLoaded = null;
                    resolve();
                }
            });
        });
}, getFuncId);

const onRichLinksUpgraded = memoize(rules => qwery('.element-rich-link--not-upgraded', rules.body).length === 0 ?
        true :
        new Promise((resolve) => {
            mediator.once('rich-link:loaded', resolve);
        }), getFuncId);

const onInteractivesLoaded = memoize((rules) => {
    const notLoaded = qwery('.element-interactive', rules.body).filter((interactive) => {
        const iframe = qwery(interactive.children).filter(isIframe);
        return !(iframe.length && isIframeLoaded(iframe[0]));
    });

    return notLoaded.length === 0 || !('MutationObserver' in window) ?
        true :
        Promise.all(notLoaded.map(interactive => new Promise((resolve) => {
            new MutationObserver((records, instance) => {
                if (!(records.length > 0 &&
                            records[0].addedNodes.length > 0 &&
                            isIframe(records[0].addedNodes[0]))) {
                    return;
                }

                const iframe = records[0].addedNodes[0];
                if (isIframeLoaded(iframe)) {
                    instance.disconnect();
                    resolve();
                } else {
                    iframe.addEventListener('load', () => {
                        instance.disconnect();
                        resolve();
                    });
                }
            }).observe(interactive, {
                childList: true,
            });
        })));

    function isIframe(node) {
        return node.nodeName === 'IFRAME';
    }

    function isIframeLoaded(iframe) {
        try {
            return iframe.contentWindow &&
                iframe.contentWindow.document &&
                iframe.contentWindow.document.readyState === 'complete';
        } catch (err) {
            return true;
        }
    }
}, getFuncId);

const onAdsLoaded = memoize(rules => Promise.all(qwery('.js-ad-slot', rules.body)
    .map(ad => ad.id)
    .map(trackAdRender)
    ), getFuncId);

// test one element vs another for the given rules
function _testCandidate(rules, challenger, opponent) {
    const isMinAbove = challenger.top - opponent.bottom >= rules.minAbove;
    const isMinBelow = opponent.top - challenger.top >= rules.minBelow;

    return isMinAbove || isMinBelow;
}

// test one element vs an array of other elements for the given rules
function _testCandidates(rules, challenger, opponents) {
    return opponents.every(_testCandidate.bind(undefined, rules, challenger));
}

function _mapElementToComputedDimensions(el) {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        bottom: rect.bottom,
        element: el,
    };
}

function _mapElementToDimensions(el) {
    return {
        top: el.offsetTop,
        bottom: el.offsetTop + el.offsetHeight,
        element: el,
    };
}

function _enforceRules(data, rules) {
    let candidates = data.candidates;

    // enforce absoluteMinAbove rule
    if (rules.absoluteMinAbove) {
        candidates = candidates.filter(candidate => candidate.top >= rules.absoluteMinAbove);
    }

    // enforce minAbove and minBelow rules
    candidates = candidates.filter((candidate) => {
        const farEnoughFromTopOfBody = candidate.top >= rules.minAbove;
        const farEnoughFromBottomOfBody = candidate.top + rules.minBelow <= data.bodyHeight;
        return farEnoughFromTopOfBody && farEnoughFromBottomOfBody;
    });

    // enforce content meta rule
    if (rules.clearContentMeta) {
        candidates = candidates.filter(candidate => candidate.top > (data.contentMeta.bottom + rules.clearContentMeta));
    }

    // enforce selector rules
    if (rules.selectors) {
        Object.keys(rules.selectors).forEach((selector) => {
            candidates = candidates.filter(candidate => _testCandidates(rules.selectors[selector], candidate, data.opponents[selector]));
        });
    }

    if (rules.filter) {
        candidates = candidates.filter(rules.filter, rules);
    }

    return candidates;
}

function SpaceError(rules) {
    this.name = 'SpaceError';
    this.message = `There is no space left matching rules from ${rules.bodySelector}`;
    this.stack = (new Error()).stack;
}

// Rather than calling this directly, use spaceFiller to inject content into the page.
// SpaceFiller will safely queue up all the various asynchronous DOM actions to avoid any race conditions.
function findSpace(rules, options) {
    let getDimensions;

    rules || (rules = defaultRules);
    options || (options = defaultOptions);
    rules.body = rules.bodySelector ? document.querySelector(rules.bodySelector) : document;
    getDimensions = rules.absoluteMinAbove ? _mapElementToComputedDimensions : _mapElementToDimensions;

    return getReady()
        .then(getCandidates)
        .then(getMeasurements)
        .then(enforceRules)
        .then(returnCandidates);

    function getReady() {
        return Promise.race([
            new Promise(expire),
            Promise.all([
                options.waitForImages ? onImagesLoaded(rules) : true,
                options.waitForLinks ? onRichLinksUpgraded(rules) : true,
                options.waitForInteractives ? onInteractivesLoaded(rules) : true,
                options.waitForAds ? onAdsLoaded(rules) : true,
            ]),
        ]);
    }

    function getCandidates() {
        let candidates = qwery(rules.bodySelector + rules.slotSelector);
        if (rules.fromBottom) {
            candidates.reverse();
        }
        if (rules.startAt) {
            let drop = true;
            candidates = candidates.filter((candidate) => {
                if (candidate === rules.startAt) {
                    drop = false;
                }
                return !drop;
            });
        }
        if (rules.stopAt) {
            let keep = true;
            candidates = candidates.filter((candidate) => {
                if (candidate === rules.stopAt) {
                    keep = false;
                }
                return keep;
            });
        }
        return candidates;
    }

    function getMeasurements(candidates) {
        const contentMeta = rules.clearContentMeta ?
            document.querySelector('.js-content-meta') :
            null;
        const opponents = rules.selectors ?
            Object.keys(rules.selectors).map(selector => [selector, qwery(rules.bodySelector + selector)]) :
            null;

        return fastdom.read(() => {
            const bodyDims = rules.body.getBoundingClientRect();
            const candidatesWithDims = candidates.map(getDimensions);
            const contentMetaWithDims = rules.clearContentMeta ?
                getDimensions(contentMeta) :
                null;
            const opponentsWithDims = opponents ?
                opponents.reduce((result, selectorAndElements) => {
                    result[selectorAndElements[0]] = selectorAndElements[1].map(getDimensions);
                    return result;
                }, {}) :
                null;

            if (rules.absoluteMinAbove) {
                rules.absoluteMinAbove -= bodyDims.top;
            }

            return {
                bodyHeight: bodyDims.height,
                candidates: candidatesWithDims,
                contentMeta: contentMetaWithDims,
                opponents: opponentsWithDims,
            };
        });
    }

    function enforceRules(data) {
        return _enforceRules(data, rules);
    }

    function returnCandidates(candidates) {
        if (candidates.length) {
            return candidates.map(candidate => candidate.element);
        } else {
            throw new SpaceError(rules);
        }
    }
}

export default {
    findSpace,
    SpaceError,

    _testCandidate, // exposed for unit testing
    _testCandidates, // exposed for unit testing
};
