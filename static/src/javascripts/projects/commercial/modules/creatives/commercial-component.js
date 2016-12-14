/*
 Module: commercial/creatives/commercial-component.js
 Description: Loads our commercial components
 */
import fastdom from 'fastdom';
import Promise from 'Promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import lazyload from 'common/modules/lazyload';
import Toggles from 'common/modules/ui/toggles';
import isArray from 'lodash/objects/isArray';
import pick from 'lodash/objects/pick';
import merge from 'lodash/objects/merge';
import map from 'lodash/collections/map';
import reduce from 'lodash/collections/reduce';
const urlBuilders = {
    soulmates: defaultUrlBuilder('soulmates/mixed'),
    capiSingle: complexUrlBuilder('capi-single', false, false, true),
    capi: complexUrlBuilder('capi', false, false, true),
    paidforCard: complexUrlBuilder('paid', '', false, true),
    books: complexUrlBuilder('books/books', 'isbns'),
    jobs: complexUrlBuilder('jobs', 'jobIds', true),
    masterclasses: complexUrlBuilder('masterclasses', 'ids', true),
    liveevents: complexUrlBuilder('liveevents/event', 'id', true),
    travel: complexUrlBuilder('travel/offers', 'ids', true),
    multi: complexUrlBuilder('multi', '', true),
    book: bookUrlBuilder('books/book'),
    soulmatesGroup: soulmatesGroupUrlBuilder('soulmates/'),
};

function defaultUrlBuilder(url) {
    return params => buildComponentUrl(url, params);
}

function bookUrlBuilder(url) {
    return (params) => {
        const isbn = config.page.isbn || params.isbn;
        if (isbn) {
            return buildComponentUrl(url, merge(params, {
                t: isbn,
            }));
        } else {
            return false;
        }
    };
}

function soulmatesGroupUrlBuilder(url) {
    return params => buildComponentUrl(url + params.soulmatesFeedName, params);
}

function complexUrlBuilder(url, withSpecificId, withKeywords, withSection) {
    return params => buildComponentUrl(url, merge(
        params,
        withSpecificId && params[withSpecificId] ? {
            t: params[withSpecificId].split(','),
        } : {},
        withKeywords ? getKeywords() : {},
        withSection ? {
            s: config.page.section,
        } : {}
    ));
}

function createToggle(el) {
    if (el.querySelector('.popup__toggle')) {
        new Toggles(el).init();
    }
}

function adjustMostPopHeight(el) {
    let adSlotHeight;
    const $adSlot = $(el);
    const $mostPopTabs = $('.js-most-popular-footer .tabs__pane');
    let mostPopTabsHeight;

    if ($adSlot.hasClass('ad-slot--mostpop')) {
        fastdom.read(() => {
            adSlotHeight = $adSlot.dim().height;
            mostPopTabsHeight = $mostPopTabs.dim().height;

            if (adSlotHeight > mostPopTabsHeight) {
                fastdom.write(() => {
                    $mostPopTabs.css('height', adSlotHeight);
                });
            }
        });
    }
}

function setFluid(el) {
    if (el.classList.contains('ad-slot--container-inline')) {
        el.classList.add('ad-slot--fluid');
    }
}

function constructQuery(params) {
    return reduce(params, (result, value, key) => {
        const buildParam = value => `${key}=${encodeURIComponent(value)}`;

        if (result !== '?') {
            result += '&';
        }

        return result + (isArray(value) ? map(value, buildParam).join('&') : buildParam(value));
    }, '?');
}

function buildComponentUrl(url, params) {
    // filter out empty params
    const filteredParams = pick(params, v => isArray(v) ? v.length : v);
    const query = Object.keys(filteredParams).length ? constructQuery(filteredParams) : '';
    return `${config.page.ajaxUrl}/commercial/${url}.json${query}`;
}

function getKeywords() {
    const keywords = config.page.keywordIds ?
        map(config.page.keywordIds.split(','), getKeyword) :
        getKeyword(config.page.pageId);
    return {
        k: keywords,
    };

    function getKeyword(str) {
        return str.substring(str.lastIndexOf('/') + 1);
    }
}

/**
 * Loads commercial components.
 * * https://www.google.com/dfp/59666047#delivery/CreateCreativeTemplate/creativeTemplateId=10023207
 *
 * @constructor
 * @extends Component
 * @param {Object=} adSlot
 * @param {Object=} params
 */
function CommercialComponent(adSlot, params) {
    if (params.type == 'book') {
        fastdom.write(() => {
            $(adSlot).addClass('ad-slot--books-inline');
        });
    }
    this.params = params || {};
    this.type = this.params.type;
    // remove type from params
    this.params.type = null;
    this.adSlot = adSlot.length ? adSlot[0] : adSlot;
    this.url = urlBuilders[this.type](this.params);
}

CommercialComponent.prototype.create = function () {
    return new Promise((resolve) => {
        if (this.url) {
            lazyload({
                url: this.url,
                container: this.adSlot,
                success: onSuccess.bind(this),
                error: onError.bind(this),
            });
        } else {
            resolve(false);
        }

        function onSuccess() {
            if (this.postLoadEvents[this.type]) {
                this.postLoadEvents[this.type](this.adSlot);
            }

            resolve(true);
        }

        function onError() {
            resolve(false);
        }
    });
};

CommercialComponent.prototype.postLoadEvents = {
    capi: createToggle,
    capiSingle: createToggle,
    paidforCard(el) {
        setFluid(el);
        adjustMostPopHeight(el);
        createToggle(el);
    },
};

export default CommercialComponent;
