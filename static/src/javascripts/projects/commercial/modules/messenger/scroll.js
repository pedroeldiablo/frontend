import addEventListener from 'common/utils/add-event-listener';
import closest from 'common/utils/closest';
import detect from 'common/utils/detect';
import fastdom from 'common/utils/fastdom-promise';
import messenger from 'commercial/modules/messenger';
// An intersection observer will allow us to efficiently send slot
// coordinates for only those that are in the viewport.
let w = window;
let useIO = 'IntersectionObserver' in w;
let taskQueued = false;
let iframes = {};
let iframeCounter = 0;
let observer;
let visibleIframeIds;

messenger.register('scroll', onMessage, {
    persist: true,
});

export default {
    addScrollListener,
    removeScrollListener,
    reset,
};

function reset(window_) {
    w = window_ || window;
    useIO = 'IntersectionObserver' in w;
    taskQueued = false;
    iframes = {};
    iframeCounter = 0;
}

function onMessage(respond, start, iframe) {
    if (start) {
        addScrollListener(iframe, respond);
    } else {
        removeScrollListener(iframe);
    }
}

function addScrollListener(iframe, respond) {
    if (iframeCounter === 0) {
        addEventListener(w, 'scroll', onScroll, {
            passive: true,
        });
        if (useIO) {
            observer = new w.IntersectionObserver(onIntersect);
        }
    }

    iframes[iframe.id] = {
        node: iframe,
        // When using IOs, a slot is hidden by default. When the IO starts
        // observing it, the onIntercept callback will be triggered if it
        // is already in the viewport
        visible: !useIO,
        respond,
    };
    iframeCounter += 1;

    if (useIO) {
        observer.observe(iframe);
    }

    fastdom.read(() => iframe.getBoundingClientRect())
        .then((domRect) => {
            sendCoordinates(iframe.id, domRect);
        });
}

function removeScrollListener(iframe) {
    if (iframes[iframe.id]) {
        if (useIO && observer) {
            observer.unobserve(iframe);
        }
        iframes[iframe.id] = false;
        iframeCounter -= 1;
    }

    if (iframeCounter === 0) {
        w.removeEventListener('scroll', onScroll);
        if (useIO && observer) {
            observer.disconnect();
            observer = null;
        }
    }
}

function onScroll() {
    if (!taskQueued) {
        const viewport = detect.getViewport();
        taskQueued = true;

        return fastdom.read(() => {
            taskQueued = false;

            const iframeIds = Object.keys(iframes);

            if (useIO) {
                visibleIframeIds
                    .map(getDimensions)
                    .forEach((data) => {
                        sendCoordinates(data[0], data[1]);
                    });
            } else {
                iframeIds
                    .map(getDimensions)
                    .filter(isIframeInViewport, viewport)
                    .forEach((data) => {
                        sendCoordinates(data[0], data[1]);
                    });
            }
        });
    }
}

function isIframeInViewport(item) {
    return item[1].bottom > 0 && item[1].top < this.height;
}

function getDimensions(id) {
    return [id, iframes[id].node.getBoundingClientRect()];
}

function onIntersect(changes) {
    visibleIframeIds = changes
        .filter(_ => _.intersectionRatio > 0)
        .map(_ => _.target.id);
}

// Instances of classes bound to the current view are not serialised correctly
// by JSON.stringify. That's ok, we don't care if it's a DOMRect or some other
// object, as long as the calling view receives the frame coordinates.
function domRectToRect(rect) {
    return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
    };
}

function sendCoordinates(iframeId, domRect) {
    iframes[iframeId].respond(null, domRectToRect(domRect));
}
