/* global twttr:false */

import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import debounce from 'lodash/functions/debounce';
const body = qwery('.js-liveblog-body, .js-article__body, .js-article__body--minute-article');

function bootstrap() {
    mediator.on('window:throttledScroll', debounce(enhanceTweets, 200));
}

function enhanceTweets() {
    if ((detect.getBreakpoint() === 'mobile' && !config.page.isMinuteArticle) || !config.switches.enhanceTweets) {
        return;
    }

    let tweetElements = qwery('blockquote.js-tweet');
    let viewportHeight = bonzo.viewport().height;
    let scrollTop = window.pageYOffset;

    tweetElements.forEach((element) => {
        let $el = bonzo(element);
        let elOffset = $el.offset();
        if (((scrollTop + (viewportHeight * 2.5)) > elOffset.top) && (scrollTop < (elOffset.top + elOffset.height))) {
            fastdom.write(() => {
                $(element).removeClass('js-tweet').addClass('twitter-tweet');
                // We only want to render tweets once the class has been added
                renderTweets();
            });
        }
    });
}

function renderTweets() {
    let scriptElement;
    let nativeTweetElements = qwery('blockquote.twitter-tweet');
    let widgetScript = qwery('#twitter-widget');

    if (nativeTweetElements.length > 0) {
        if (widgetScript.length === 0) {
            scriptElement = document.createElement('script');
            scriptElement.id = 'twitter-widget';
            scriptElement.async = true;
            scriptElement.src = '//platform.twitter.com/widgets.js';
            $(document.body).append(scriptElement);
        }

        if (typeof twttr !== 'undefined' && 'widgets' in twttr && 'load' in twttr.widgets) {
            twttr.widgets.load(body);
        }
    }
}

export default {
    init: bootstrap,
    enhanceTweets,
};
