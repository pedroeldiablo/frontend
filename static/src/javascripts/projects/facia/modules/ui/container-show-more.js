import bonzo from 'bonzo';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import fetchJson from 'common/utils/fetch-json';
import mediator from 'common/utils/mediator';
import reportError from 'common/utils/report-error';
import timeout from 'common/utils/timeout';
import userPrefs from 'common/modules/user-prefs';
import groupBy from 'lodash/collections/groupBy';
import filter from 'lodash/collections/filter';
import map from 'lodash/collections/map';
import forEach from 'lodash/collections/forEach';
import find from 'lodash/collections/find';
const HIDDEN_CLASS_NAME = 'fc-show-more--hidden';
const VISIBLE_CLASS_NAME = 'fc-show-more--visible';
const TEXT_HOOK = 'js-button-text';
const PREF_NAME = 'section-states';
const BUTTON_SPINNER_CLASS = 'collection__show-more--loading';
const ARTICLE_ID_ATTRIBUTE = 'data-id';
const ITEM_SELECTOR = '.js-fc-item';
const STATE_DISPLAYED = 'displayed';
const STATE_HIDDEN = 'hidden';
const STATE_LOADING = 'loading';
const REQUEST_TIMEOUT = 5000;

function setButtonState(button, state) {
    const text = button.text[state];
    button.$textEl.html(text);
    button.$el.attr('data-link-name', state === STATE_DISPLAYED ? 'less' : 'more')
        .toggleClass('button--primary', state !== STATE_DISPLAYED)
        .toggleClass('button--tertiary', state === STATE_DISPLAYED)
        .toggleClass(BUTTON_SPINNER_CLASS, state === STATE_LOADING);
    button.$container.toggleClass(HIDDEN_CLASS_NAME, state !== STATE_DISPLAYED)
        .toggleClass(VISIBLE_CLASS_NAME, state === STATE_DISPLAYED);
    button.state = state;
}

function updatePref(containerId, state) {
    const prefs = userPrefs.get(PREF_NAME, {
        type: 'session',
    }) || {};
    if (state !== STATE_DISPLAYED) {
        delete prefs[containerId];
    } else {
        prefs[containerId] = 'more';
    }
    userPrefs.set(PREF_NAME, prefs, {
        type: 'session',
    });
}

function readPrefs(containerId) {
    const prefs = userPrefs.get(PREF_NAME, {
        type: 'session',
    });
    return (prefs && prefs[containerId]) ? STATE_DISPLAYED : STATE_HIDDEN;
}

function showMore(button) {
    fastdom.write(() => {
        /**
         * Do not remove: it should retain context for the click stream module, which recurses upwards through
         * DOM nodes.
         */
        setButtonState(button, (button.state === STATE_HIDDEN) ? STATE_DISPLAYED : STATE_HIDDEN);
        updatePref(button.id, button.state);
    });
}

function renderToDom(button) {
    fastdom.write(() => {
        button.$container.addClass(HIDDEN_CLASS_NAME)
            .removeClass('js-container--fc-show-more')
            .toggleClass(HIDDEN_CLASS_NAME, button.state === STATE_HIDDEN);
        // Initialise state, as it might be different from what was rendered server side based on localstorage prefs
        setButtonState(button, button.state);
    });
}

function loadShowMore(pageId, containerId) {
    const url = `/${pageId}/show-more/${containerId}.json`;
    return timeout(REQUEST_TIMEOUT, fetchJson(url, {
        mode: 'cors',
    }));
}

function dedupShowMore($container, html) {
    const seenArticles = itemsByArticleId($container);
    const $html = bonzo.create(html);

    $(ITEM_SELECTOR, $html).each((article) => {
        const $article = bonzo(article);
        if ($article.attr(ARTICLE_ID_ATTRIBUTE) in seenArticles) {
            $article.remove();
        }
    });

    return $html;
}

function loadShowMoreForContainer(button) {
    fastdom.write(() => {
        setButtonState(button, STATE_LOADING);
    });

    loadShowMore(config.page.pageId, button.id).then((response) => {
        let dedupedShowMore;
        const html = response.html.trim();

        if (html) {
            dedupedShowMore = dedupShowMore(button.$container, html);
        }

        fastdom.write(() => {
            if (dedupedShowMore) {
                button.$placeholder.replaceWith(dedupedShowMore);
            }
            setButtonState(button, STATE_DISPLAYED);
            updatePref(button.id, button.state);
            mediator.emit('modules:show-more:loaded');
        });
        button.isLoaded = true;
    }).catch((err) => {
        fastdom.write(() => {
            setButtonState(button, STATE_HIDDEN);
        });

        showErrorMessage(button);
        reportError(err, {
            feature: 'container-show-more',
        }, false);
    });
}

function hideErrorMessage($errorMessage) {
    fastdom.write(() => {
        $errorMessage.addClass('show-more__error-message--invisible');
    });
}

function showErrorMessage(button) {
    if (button.$errorMessage) {
        button.$errorMessage.remove();
    }

    button.$errorMessage = bonzo(bonzo.create(
        '<div class="show-more__error-message">' +
        'Sorry, failed to load more stories. Please try again.' +
        '</div>'
    ));

    fastdom.write(() => {
        button.$errorMessage.insertAfter(button.$el);

        setTimeout(() => {
            hideErrorMessage(button.$errorMessage);
        }, 5000);
    });
}

function itemsByArticleId($el) {
    return groupBy(qwery(ITEM_SELECTOR, $el), el => bonzo(el).attr(ARTICLE_ID_ATTRIBUTE));
}

function makeButton($container) {
    let id;
    let state;
    let button;
    const $el = $('.js-show-more-button', $container);

    if ($el) {
        id = $container.attr('data-id');
        state = readPrefs(id);

        button = {
            $el,
            $container,
            $iconEl: $('.i', $el),
            $placeholder: $('.js-show-more-placeholder', $container),
            $textEl: $(`.${TEXT_HOOK}`, $el),
            id,
            text: {
                hidden: $('.js-button-text', $el).text(),
                displayed: 'Less',
                loading: 'Loading&hellip;',
            },
            state,
            isLoaded: false,
            $errorMessage: null,
        };

        if (state === STATE_DISPLAYED) {
            loadShowMoreForContainer(button);
        }

        return button;
    }
}

export default {
    itemsByArticleId,
    dedupShowMore,
    init() {
        fastdom.read(() => {
            const containers = qwery('.js-container--fc-show-more').map(bonzo);
            const buttons = filter(map(containers, makeButton));

            forEach(buttons, renderToDom);

            mediator.on('module:clickstream:click', (clickSpec) => {
                const clickedButton = find(buttons, button => button.$el[0] === clickSpec.target);
                if (clickedButton && clickedButton.state !== STATE_LOADING) {
                    if (clickedButton.isLoaded) {
                        showMore(clickedButton);
                    } else {
                        if (clickedButton.$errorMessage) {
                            clickedButton.$errorMessage.hide();
                        }
                        loadShowMoreForContainer(clickedButton);
                    }
                }
            });
        });
    },
};
