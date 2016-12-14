import detect from 'common/utils/detect';
import fastdom from 'common/utils/fastdom-promise';
import messenger from 'commercial/modules/messenger';
let w = window;
let iframes = {};
let iframeCounter = 0;
let taskQueued = false;
let lastViewportRead,
    lastViewport;

messenger.register('viewport', onMessage, {
    persist: true,
});
lastViewportRead = fastdom.read(() => {
    lastViewport = detect.getViewport();
});

export default {
    addResizeListener,
    removeResizeListener,
    reset,
};

function reset(window_) {
    w = window_ || window;
    taskQueued = false;
    iframes = {};
    iframeCounter = 0;
}

function onMessage(respond, start, iframe) {
    if (start) {
        addResizeListener(iframe, respond);
    } else {
        removeResizeListener(iframe);
    }
}

function addResizeListener(iframe, respond) {
    if (iframeCounter === 0) {
        w.addEventListener('resize', onResize);
    }

    iframes[iframe.id] = {
        node: iframe,
        respond,
    };
    iframeCounter += 1;
    return lastViewportRead.then(() => {
        sendViewportDimensions.bind(lastViewport)(iframe.id);
    });
}

function removeResizeListener(iframe) {
    if (iframes[iframe.id]) {
        iframes[iframe.id] = false;
        iframeCounter -= 1;
    }

    if (iframeCounter === 0) {
        w.removeEventListener('resize', onResize);
    }
}

function onResize() {
    if (!taskQueued) {
        taskQueued = true;

        return fastdom.read(() => lastViewport = detect.getViewport()).then((viewport) => {
            Object.keys(iframes).forEach(sendViewportDimensions, viewport);
            taskQueued = false;
        });
    }
}

function sendViewportDimensions(iframeId) {
    iframes[iframeId].respond(null, this);
}
