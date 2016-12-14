import bean from 'bean';
import bonzo from 'bonzo';
import $ from 'common/utils/$';
import fastdom from 'fastdom';
import qwery from 'qwery';
import Promise from 'Promise';
import config from 'common/utils/config';
import fetchJson from 'common/utils/fetch-json';
import reportError from 'common/utils/report-error';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import relativeDates from 'common/modules/ui/relativedates';
import svgs from 'common/views/svgs';
import alertHtml from 'text!common/views/breaking-news.html';
import isArray from 'lodash/objects/isArray';
import has from 'lodash/objects/has';
import flatten from 'lodash/arrays/flatten';
import pick from 'lodash/objects/pick';

const supportedSections = {
    sport: 'sport',
    football: 'sport',
};

const breakingNewsURL = '/news-alert/alerts';
const page = config.page;

const // get the users breaking news alert history
// {
//     alertID: true, <- dismissed/visited
//     alertID: false <- seen, but not dismissed/visited
// }
knownAlertIDsStorageKey = 'gu.breaking-news.hidden';

let knownAlertIDs;

function storeKnownAlertIDs() {
    storage.local.set(knownAlertIDsStorageKey, knownAlertIDs);
}

function markAlertAsSeen(id) {
    updateKnownAlertID(id, false);
}

function markAlertAsDismissed(id) {
    updateKnownAlertID(id, true);
}

function updateKnownAlertID(id, state) {
    knownAlertIDs[id] = state;
    storeKnownAlertIDs();
}

// if we can't record a dismissal, we won't show an alert
function userCanDismissAlerts() {
    return storage.local.isAvailable();
}

function fetchBreakingNews() {
    return fetchJson(breakingNewsURL, {
        mode: 'cors',
    });
}

// handle the breaking news JSON
function parseResponse(response) {
    return (response.collections || [])
        .filter(collection => isArray(collection.content) && collection.content.length)
        .map((collection) => {
            // collection.href is string or null
            collection.href = (collection.href || '').toLowerCase();
            return collection;
        });
}

// pull out the alerts from the edition/section buckets that apply to us
// global > current edition > current section
function getRelevantAlerts(alerts) {
    const edition = (page.edition || '').toLowerCase();
    const section = supportedSections[page.section];

    return flatten([
        alerts
            .filter(alert => alert.href === 'global')
            .map(alert => alert.content),
        alerts
            .filter(alert => alert.href === edition)
            .map(alert => alert.content),
        alerts
            .filter(alert => section && alert.href === section)
            .map(alert => alert.content),
    ]);
}

// keep the local alert history in sync with live alerts
function pruneKnownAlertIDs(alerts) {
    // 'dismiss' this page ID, since if there's an alert for it,
    // we don't want to show it ever
    knownAlertIDs[page.pageId] = true;

    // then remove all known alert ids that are not
    // in the current breaking news alerts
    knownAlertIDs = pick(knownAlertIDs, (state, id) => alerts.some(alert => alert.id === id));

    storeKnownAlertIDs();
    return alerts;
}

// don't show alerts if we've already dismissed them
function filterAlertsByDismissed(alerts) {
    return alerts.filter(alert => knownAlertIDs[alert.id] !== true);
}

// don't show alerts if they're over a certain age
function filterAlertsByAge(alerts) {
    return alerts.filter((alert) => {
        const alertTime = alert.frontPublicationDate;
        return alertTime && relativeDates.isWithinSeconds(new Date(alertTime), 1200); // 20 mins
    });
}

// we only show one alert at a time, pick the youngest available
function pickNewest(alerts) {
    return alerts.sort((a, b) => b.frontPublicationDate - a.frontPublicationDate)[0];
}

// show an alert
function alert(alert) {
    if (alert) {
        const $body = bonzo(document.body);
        const $breakingNews = bonzo(qwery('.js-breaking-news-placeholder'));

        // if its the first time we've seen this alert, we wait 3 secs to show it
        // otherwise we show it immediately
        const alertDelay = has(knownAlertIDs, alert.id) ? 0 : init.DEFAULT_DELAY;

        // $breakingNews is hidden, so this won't trigger layout etc
        $breakingNews.append(renderAlert(alert));

        // copy of breaking news banner (with blank content) used inline at the
        // bottom of the body, so the bottom of the body can visibly scroll
        // past the pinned alert
        const $spectre = renderSpectre($breakingNews);

        // inject the alerts into DOM
        setTimeout(() => {
            fastdom.write(() => {
                if (alertDelay === 0) {
                    $breakingNews.removeClass('breaking-news--fade-in');
                }
                $body.append($spectre);
                $breakingNews.removeClass('breaking-news--hidden');
                markAlertAsSeen(alert.id);
            });
        }, alertDelay);
    }
    return alert;
}

function renderAlert(alert) {
    alert.marque36icon = svgs('marque36icon');
    alert.closeIcon = svgs('closeCentralIcon');

    const $alert = bonzo.create(template(alertHtml, alert));

    bean.on($('.js-breaking-news__item__close', $alert)[0], 'click', () => {
        fastdom.write(() => {
            $('[data-breaking-article-id]').hide();
        });
        markAlertAsDismissed(alert.id);
    });

    return $alert;
}

function renderSpectre($breakingNews) {
    return bonzo(bonzo.create($breakingNews[0]))
        .addClass('breaking-news--spectre')
        .removeClass('breaking-news--fade-in breaking-news--hidden');
}

function init() {
    if (userCanDismissAlerts()) {
        knownAlertIDs = storage.local.get(knownAlertIDsStorageKey) || {};

        return fetchBreakingNews()
            .then(parseResponse)
            .then(getRelevantAlerts)
            .then(pruneKnownAlertIDs)
            .then(filterAlertsByDismissed)
            .then(filterAlertsByAge)
            .then(pickNewest)
            .then(alert)
            .catch((ex) => {
                reportError(ex, {
                    feature: 'breaking-news',
                });
            });
    } else {
        return Promise.reject(new Error('cannot dismiss'));
    }
}

init.DEFAULT_DELAY = 3000;
export default init;
