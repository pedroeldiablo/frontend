import Promise from 'Promise';
import addEventListener from 'common/utils/add-event-listener';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import closest from 'common/utils/closest';
import fastdom from 'common/utils/fastdom-promise';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import messenger from 'commercial/modules/messenger';
const topSlotId = 'dfp-ad--top-above-nav';
let updateQueued = false;
let win;
let header;
let headerHeight;
let topSlot;
let topSlotHeight;
let topSlotStyles;
let stickyBanner;
let scrollY;

export default {
    init,
    update,
    resize: resizeStickyBanner,
    onScroll,
};

function init(moduleName, _window) {
    win = _window || window;
    topSlot = document.getElementById(topSlotId);
    if (topSlot && detect.isBreakpoint({
        min: 'desktop',
    })) {
        header = document.getElementById('header');
        stickyBanner = topSlot.parentNode;

        // First, let's assign some default values so that everything
        // is in good order before we start animating changes in height
        const promise = initState()
            // Second, start listening for height and scroll changes
            .then(setupListeners);
        promise.then(onFirstRender);
        return promise;
    } else {
        topSlot = null;
        return Promise.resolve();
    }
}

function initState() {
    return fastdom.read(() => {
        headerHeight = header.offsetHeight;
        return topSlot.offsetHeight;
    })
        .then(currentHeight => Promise.all([
            resizeStickyBanner(currentHeight),
            onScroll(),
        ]));
}

// Register a message listener for when the creative wants to resize
// its container
// We also listen for scroll events if we need to, to snap the slot in
// place when it reaches the end of the header.
function setupListeners() {
    messenger.register('resize', onResize);
    if (!config.page.hasSuperStickyBanner) {
        addEventListener(win, 'scroll', onScroll, {
            passive: true,
        });
    }
}

function onFirstRender() {
    trackAdRender(topSlotId)
        .then((isRendered) => {
            if (isRendered) {
                fastdom.read(() => topSlot.offsetHeight)
                    .then(resizeStickyBanner);
            }
        });
}

function onResize(specs, _, iframe) {
    if (topSlot.contains(iframe)) {
        update(specs.height);
        messenger.unregister('resize', onResize);
    }
}

function update(newHeight) {
    return fastdom.read(() => {
        topSlotStyles || (topSlotStyles = win.getComputedStyle(topSlot));
        return newHeight + parseInt(topSlotStyles.paddingTop) + parseInt(topSlotStyles.paddingBottom);
    })
        .then(resizeStickyBanner);
}

function onScroll() {
    scrollY = win.pageYOffset;
    if (!updateQueued) {
        updateQueued = true;
        return fastdom.write(() => {
            updateQueued = false;
            if (headerHeight < scrollY) {
                stickyBanner.style.position = 'absolute';
                stickyBanner.style.top = `${headerHeight}px`;
            } else {
                stickyBanner.style.position =
                        stickyBanner.style.top = null;
            }
        })
            .then(setupAnimation);
    }
}

// Sudden changes in the layout can be jarring to the user, so we animate
// them for a better experience. We only do this if the slot is in view
// though.
function setupAnimation() {
    return fastdom.write(() => {
        if (scrollY <= headerHeight) {
            header.classList.add('l-header--animate');
            stickyBanner.classList.add('sticky-top-banner-ad--animate');
        } else {
            header.classList.remove('l-header--animate');
            stickyBanner.classList.remove('sticky-top-banner-ad--animate');
        }
    });
}

// Because the top banner is not in the document flow, resizing it requires
// that we also make space for it. This is done by adjusting the top margin
// of the header.
// This is also the best place to adjust the scrolling position in case the
// user has scrolled past the header.
function resizeStickyBanner(newHeight) {
    if (topSlotHeight !== newHeight) {
        return fastdom.write(() => {
            stickyBanner.classList.add('sticky-top-banner-ad');
            stickyBanner.style.height =
                header.style.marginTop = `${newHeight}px`;

            if (topSlotHeight !== undefined && headerHeight <= scrollY) {
                win.scrollBy(0, newHeight - topSlotHeight);
            }

            topSlotHeight = newHeight;
            return newHeight;
        });
    } else {
        return Promise.resolve(-1);
    }
}
