/*
 Module: history.js
 Description: Gets and sets users reading history
 */
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import template from 'common/utils/template';
import storage from 'common/utils/storage';
import url from 'common/utils/url';
import viewTag from 'text!common/views/history/tag.html';
import viewMegaNav from 'text!common/views/history/mega-nav.html';
import isObject from 'lodash/objects/isObject';
import isNumber from 'lodash/objects/isNumber';
import find from 'lodash/collections/find';
import forEach from 'lodash/collections/forEach';
import some from 'lodash/collections/some';
import keys from 'lodash/objects/keys';
import assign from 'lodash/objects/assign';
import reduce from 'lodash/collections/reduce';
import contains from 'lodash/collections/contains';
import isArray from 'lodash/objects/isArray';
import pick from 'lodash/objects/pick';
import mapValues from 'lodash/objects/mapValues';
import map from 'lodash/collections/map';
import chain from 'common/utils/chain';
import compact from 'lodash/arrays/compact';
import pluck from 'lodash/collections/pluck';
import last from 'lodash/arrays/last';
import sortBy from 'lodash/collections/sortBy';
import reduceRight from 'lodash/collections/reduceRight';

const editions = [
    'uk',
    'us',
    'au',
];

const editionalised = [
    'business',
    'commentisfree',
    'culture',
    'environment',
    'media',
    'money',
    'sport',
    'technology',
];

const pageMeta = [{
    tid: 'section',
    tname: 'sectionName',
}, {
    tid: 'keywordIds',
    tname: 'keywords',
}, {
    tid: 'seriesId',
    tname: 'series',
}, {
    tid: 'authorIds',
    tname: 'author',
}];

const buckets = [{
    type: 'content',
    indexInRecord: 1,
}, {
    type: 'front',
    indexInRecord: 2,
}];

const summaryPeriodDays = 90;
const forgetUniquesAfter = 10;
const historySize = 50;
const storageKeyHistory = 'gu.history';
const storageKeySummary = 'gu.history.summary';

const // 1 day in ms
today = Math.floor(Date.now() / 86400000);

let historyCache;
let summaryCache;
let popularFilteredCache;
let topNavItemsCache;
let inMegaNav = false;
const isEditionalisedRx = new RegExp(`^(${editions.join('|')})\/(${editionalised.join('|')})$`);
const stripEditionRx = new RegExp(`^(${editions.join('|')})\/`);

function saveHistory(history) {
    historyCache = history;
    return storage.local.set(storageKeyHistory, history);
}

function saveSummary(summary) {
    summaryCache = summary;
    return storage.local.set(storageKeySummary, summary);
}

function getHistory() {
    historyCache = historyCache || storage.local.get(storageKeyHistory) || [];
    return historyCache;
}

function getSummary() {
    if (!summaryCache) {
        summaryCache = storage.local.get(storageKeySummary);

        if (!isObject(summaryCache) || !isObject(summaryCache.tags) || !isNumber(summaryCache.periodEnd)) {
            summaryCache = {
                periodEnd: today,
                tags: {},
                showInMegaNav: true,
            };
        }
    }
    return summaryCache;
}

function seriesSummary() {
    function views(item) {
        return reduce(item, (acc, record) => acc + record[1], 0);
    }

    return chain(getSummary().tags)
        .and(pick, (v, k) => contains(k, 'series'))
        .and(mapValues, tag => views(tag[1]) + views(tag[2]))
        .value();
}

function mostViewedSeries() {
    return reduce(seriesSummary(), (best, views, tag, summary) => views > (summary[best] || 0) ? tag : best, '');
}

function deleteFromSummary(tag) {
    const summary = getSummary();

    delete summary.tags[tag];
    saveSummary(summary);
}

function isRevisit(pageId) {
    return (find(getHistory(), page => (page[0] === pageId)) || [])[1] > 1;
}

function pruneSummary(summary, mockToday) {
    const newToday = mockToday || today;
    const updateBy = newToday - summary.periodEnd;

    if (updateBy !== 0) {
        summary.periodEnd = newToday;

        forEach(summary.tags, (record, tid) => {
            const result = chain(buckets).and(map, (bucket) => {
                const visits = chain(record[bucket.indexInRecord]).and(map, (day) => {
                    const newAge = day[0] + updateBy;
                    return newAge < summaryPeriodDays && newAge >= 0 ? [newAge, day[1]] : false;
                }).and(compact).value();

                return (visits.length > 1 || (visits.length === 1 && visits[0][0] < forgetUniquesAfter)) ? visits : [];
            }).value();

            if (some(result, r => r.length)) {
                summary.tags[tid] = [record[0]].concat(result);
            } else {
                delete summary.tags[tid];
            }
        });
    }

    return summary;
}

function getPopular(opts) {
    const tags = getSummary().tags;
    let tids = keys(tags);

    const op = assign({
        number: 100,
        weights: {},
        thresholds: {},
    }, opts);

    tids = op.whitelist ? tids.filter(tid => op.whitelist.indexOf(tid) > -1) : tids;
    tids = op.blacklist ? tids.filter(tid => op.blacklist.indexOf(tid) === -1) : tids;

    return chain(tids).and(map, (tid) => {
        const record = tags[tid];
        const rank = reduce(buckets, (rank, bucket) => rank + tally(record[bucket.indexInRecord], op.weights[bucket.type], op.thresholds[bucket.type]), 0);

        return {
            idAndName: [tid, record[0]],
            rank,
        };
    })
        .and(compact)
        .and(sortBy, 'rank')
        .and(last, op.number)
        .reverse()
        .and(pluck, 'idAndName')
        .value();
}

function getContributors() {
    const contibutors = [];
    let tagId;
    const tags = getSummary().tags;
    for (tagId in tags) {
        if (tagId.indexOf('profile/') === 0) {
            contibutors.push(tags[tagId]);
        }
    }
    return contibutors;
}

function getPopularFiltered(opts) {
    const flush = opts && opts.flush;

    popularFilteredCache = (!flush && popularFilteredCache) || getPopular({
        blacklist: getTopNavItems(),
        number: 10,
        weights: {
            content: 1,
            front: 5,
        },
        thresholds: {
            content: 5,
            front: 1,
        },
    });

    return popularFilteredCache;
}

function tally(visits, weight, minimum) {
    let totalVisits = 0;
    let result;

    weight = weight || 1;
    minimum = minimum || 1;

    result = reduce(visits, (tally, day) => {
        const dayOffset = day[0];
        const dayVisits = day[1];

        totalVisits += dayVisits;
        return tally + weight * (9 + dayVisits) * (summaryPeriodDays - dayOffset);
    }, 0);

    return totalVisits < minimum ? 0 : result;
}

function firstCsv(str) {
    return (str || '').split(',')[0];
}

function collapsePath(t) {
    if (t) {
        t = t.replace(/^\/|\/$/g, '');
        if (t.match(isEditionalisedRx)) {
            t = t.replace(stripEditionRx, '');
        }
        t = t.split('/');
        t = t.length === 2 && t[0] === t[1] ? [t[0]] : t;
        return t.join('/');
    } else {
        return '';
    }
}

function reset() {
    historyCache = undefined;
    summaryCache = undefined;
    storage.local.remove(storageKeyHistory);
    storage.local.remove(storageKeySummary);
}

function logHistory(pageConfig) {
    const pageId = pageConfig.pageId;
    let history;
    let foundCount = 0;

    if (!pageConfig.isFront) {
        history = getHistory()
            .filter((item) => {
                const isArr = isArray(item);
                const found = isArr && (item[0] === pageId);

                foundCount = found ? item[1] : foundCount;
                return isArr && !found;
            });

        history.unshift([pageId, foundCount + 1]);
        saveHistory(history.slice(0, historySize));
    }
}

function logSummary(pageConfig, mockToday) {
    const summary = pruneSummary(getSummary(), mockToday);
    const page = collapsePath(pageConfig.pageId);
    let isFront = false;

    chain(pageMeta).and(reduceRight, (tagMeta, tag) => {
        const tid = collapsePath(firstCsv(pageConfig[tag.tid]));
        const tname = tid && firstCsv(pageConfig[tag.tname]);

        if (tid && tname) {
            tagMeta[tid] = tname;
        }
        isFront = isFront || tid === page;
        return tagMeta;
    }, {}).and(forEach, (tname, tid) => {
        const record = summary.tags[tid] || [];
        let visits;
        let today;

        forEach(buckets, (bucket) => {
            record[bucket.indexInRecord] = record[bucket.indexInRecord] || [];
        });

        record[0] = tname;

        visits = record[isFront ? 2 : 1];
        today = find(visits, day => day[0] === 0);

        if (today) {
            today[1] += 1;
        } else {
            visits.unshift([0, 1]);
        }

        summary.tags[tid] = record;
    });

    saveSummary(summary);
}

function getTopNavItems() {
    topNavItemsCache = topNavItemsCache || $('.js-navigation-header .js-top-navigation a').map(item => collapsePath(url.getPath($(item).attr('href'))));

    return topNavItemsCache;
}

function getMegaNav() {
    return $('.js-global-navigation');
}

function showInMegaNav() {
    let tags;
    let tagsHTML;

    if (getSummary().showInMegaNav === false) {
        return;
    }

    if (inMegaNav) {
        removeFromMegaNav();
    }

    tags = getPopularFiltered();

    if (tags.length) {
        tagsHTML = template(viewMegaNav, {
            tags: tags.map(tagHtml).join(''),
        });
        fastdom.write(() => {
            getMegaNav().prepend(tagsHTML);
        });
        inMegaNav = true;
    }
}

function removeFromMegaNav() {
    getMegaNav().each((megaNav) => {
        fastdom.write(() => {
            $('.js-global-navigation__section--history', megaNav).remove();
        });
    });
    inMegaNav = false;
}

function showInMegaNavEnabled() {
    return getSummary().showInMegaNav !== false;
}

function showInMegaNavEnable(bool) {
    const summary = getSummary();

    summary.showInMegaNav = !!bool;

    if (summary.showInMegaNav) {
        showInMegaNav();
    } else {
        removeFromMegaNav();
    }

    saveSummary(summary);
}

function tagHtml(tag, index) {
    return template(viewTag, {
        id: tag[0],
        name: tag[1],
        index: index + 1,
    });
}

export default {
    logHistory,
    logSummary,
    showInMegaNav,
    showInMegaNavEnable,
    showInMegaNavEnabled,
    getPopular,
    getPopularFiltered,
    getContributors,
    deleteFromSummary,
    isRevisit,
    reset,
    seriesSummary,
    mostViewedSeries,

    test: {
        getSummary,
        getHistory,
        pruneSummary,
        seriesSummary,
    },
};
