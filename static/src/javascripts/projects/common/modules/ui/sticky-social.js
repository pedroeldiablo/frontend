import fastdom from 'fastdom';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import ab from 'common/modules/experiments/ab';
import memoize from 'lodash/functions/memoize';

const selectorTopEl = '.social--top';
const selectorBottomEl = '.social--bottom';
const stickyClassName = 'meta__social--sticky';
const stickyRevealClassName = 'meta__social--sticky--reveal';
const stickyRevealableClassName = 'meta__social--sticky--revealable';
const deadzone = 100;
const topEl = memoize(() => $(selectorTopEl)[0]);
const bottomEl = memoize(() => $(selectorBottomEl)[0]);
let inited = false;
let revealed = false;

function setStickiness() {
    fastdom.read(() => {
        if (topEl().getBoundingClientRect().top + deadzone < 0) {
            reveal();
        } else {
            unreveal();
        }
    });
}

function determineStickiness() {
    if (inited) {
        setStickiness();
    } else if (!topEl() || !bottomEl()) {

    } else {
        fastdom.write(() => {
            $(bottomEl()).addClass(stickyClassName);
            setTimeout(makeRevealable);
            inited = true;
        });
    }
}

function makeRevealable() {
    fastdom.write(() => {
        $(bottomEl()).addClass(stickyRevealableClassName);
    });
}

function reveal() {
    if (!revealed) {
        revealed = true;
        fastdom.write(() => {
            $(bottomEl()).addClass(stickyRevealClassName);
        });
    }
}

function unreveal() {
    if (revealed) {
        revealed = false;
        fastdom.write(() => {
            $(bottomEl()).removeClass(stickyRevealClassName);
        });
    }
}

function moveToFirstPosition($el) {
    $el.parent().prepend($el.detach());
}

function init() {
    const testVariant = ab.getTestVariantId('ShareButtons2');
    let socialContext;

    if (testVariant.indexOf('referrer') > -1) {
        socialContext = detect.socialContext();

        if (socialContext) {
            fastdom.read(() => {
                [topEl(), bottomEl()].forEach((el) => {
                    if (el) {
                        fastdom.write(() => {
                            if (testVariant.indexOf('only') > -1) {
                                $(el).addClass('social--referred-only');
                            }

                            moveToFirstPosition($(`.social__item--${socialContext}`, el).addClass('social__item--referred'));
                        });
                    }
                });
            });
        }
    }

    if (testVariant.indexOf('sticky') > -1) {
        mediator.on('window:thottledScroll', determineStickiness);
    }
}

export default {
    init,
};
