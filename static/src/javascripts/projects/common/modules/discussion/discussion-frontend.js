import fastdom from 'fastdom';
import formatters from 'common/utils/formatters';
import mediator from 'common/utils/mediator';
import reportError from 'common/utils/report-error';

function load(ab, loader, opts) {
    function onDiscussionFrontendLoad(emitter) {
        emitter.on('error', (feature, error) => {
            reportError(error, {
                feature: `discussion-${feature}`,
            }, false);
        });
        emitter.once('comment-count', (value) => {
            if (value === 0) {
                loader.setState('empty');
            } else {
                // By the time discussion frontent loads, the number of comments
                // might have changed. If there are other comment counts element
                // in the page refresh their value.
                const otherValues = document.getElementsByClassName('js_commentcount_actualvalue');
                for (let i = 0, len = otherValues.length; i < len; i += 1) {
                    updateCommentCount(otherValues[i], value);
                }
            }
            mediator.emit('comments-count-loaded');
        });
    }

    function updateCommentCount(element, value) {
        fastdom.write(() => {
            element.textContent = formatters.integerCommas(value);
        });
    }

    return require('discussion-frontend-preact', (frontend) => {
        // - Inject the net module to work around the lack of a global fetch
        //   It can be removed once all browsers have window.fetch
        // - Well, it turns out that fetchJson uses reqwest which sends X-Requested-With
        //   which is not allowed by Access-Control-Allow-Headers, so don't use reqwest
        //   until discussion API is fixed
        // - Once fixed, or a global fetch is available through a polyfill, one can
        //   modify discussion-frontend to remove `fetch` polyfill and pass, if needed,
        //   opts.net = { json: fetchJson }

        frontend(opts)
            .then(onDiscussionFrontendLoad)
            .catch((error) => {
                reportError(error, {
                    feature: 'discussion',
                });
            });
    }, (error) => {
        reportError(error, {
            feature: 'discussion',
        });
    });
}

export default {
    load,
};
