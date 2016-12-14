import Promise from 'Promise';
import config from 'common/utils/config';
import ajax from 'common/utils/ajax';
import detect from 'common/utils/detect';
import url from 'common/utils/url';
import scan from 'common/utils/scan';
import mediator from 'common/utils/mediator';
import beacon from 'common/modules/analytics/beacon';
import values from 'lodash/objects/values';
import sortBy from 'lodash/collections/sortBy';
import random from 'lodash/utilities/random';
import isUndefined from 'lodash/objects/isUndefined';
import debounce from 'lodash/functions/debounce';
import map from 'lodash/collections/map';
import uniq from 'lodash/arrays/uniq';
import compact from 'lodash/arrays/compact';
import flatten from 'lodash/arrays/flatten';
import chain from 'common/utils/chain';
import filter from 'lodash/collections/filter';
import forEach from 'lodash/collections/forEach';
import reduce from 'lodash/collections/reduce';
let sample = 500;
let rxPsuedoClass = new RegExp(/:+[^\s\,]+/g);
let rxSeparator = new RegExp(/\s*,\s*/g);
let classNameLoggable = 'js-loggable';
let classNameInlined = 'js-inlined';
let eventsInitialised = false;

function getRules(s) {
    const rules = s ? s.cssRules || s.rules : null;
    return rules ? values(rules) : s;
}

function getSplitSelectors(ruleObj) {
    return ruleObj && ruleObj.selectorText && ruleObj.selectorText.replace(rxPsuedoClass, '').split(rxSeparator);
}

function canonicalise(selector) {
    const siblings = selector.match(/\.[^\s\.]+\.[^\s]+/g) || [];

    siblings.forEach((s) => {
        selector = selector.replace(s, canonicalOrder(s));
    });
    return selector.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
}

function canonicalOrder(s) {
    return sortBy(s.split('.')).join('.');
}

function getAllSelectors(all) {
    let rand;
    let len;

    let rules = chain(getInlineStylesheets())
    .and(map, getRules)
    .and(flatten)
    .and(map, getRules) // 2nd pass for rules nested in media queries
    .and(flatten)
    .and(map, getSplitSelectors)
    .and(flatten)
    .and(compact)
    .and(uniq)
    .and(map, canonicalise)
    .value();

    if (all) {
        return rules;
    } else {
        len = rules.length;
        rand = random(0, len);
        return rules.slice(rand, rand + sample).concat(rand + sample < len ? [] : rules.slice(0, (rand + sample) % len));
    }
}

function getInlineStylesheets() {
    return chain(document.styleSheets).and(filter, sheet => sheet &&
            values(sheet.rules || sheet.cssRules).length > 0 &&
            sheet.ownerNode &&
            sheet.ownerNode.nodeName === 'STYLE' &&
            sheet.ownerNode.className.indexOf(classNameLoggable) > -1).value();
}

function reloadSheetInline(sheet) {
    return ajax({
        url: sheet.href,
        crossOrigin: true,
    }).then((resp) => {
        const el = document.createElement('style');
        el.className = classNameLoggable;
        el.innerHTML = resp;
        document.getElementsByTagName('head')[0].appendChild(el);
    });
}

function reloadSheetsInline() {
    return Promise.all(
        chain(document.styleSheets).and(filter, sheet => sheet &&
                sheet.href &&
                sheet.href.match(/\/\/(localhost|assets\.guim\.co\.uk)/) &&
                (!sheet.media || sheet.media.mediaText !== 'print') &&
                sheet.ownerNode.className.indexOf(classNameInlined) === -1).and(forEach, (sheet) => {
                    sheet.ownerNode.className += ` ${classNameInlined}`;
                }).and(map, reloadSheetInline).value()
    );
}

function sendReport(all) {
    reloadSheetsInline()
        .then(() => {
            beacon.postJson('/css', JSON.stringify({
                selectors: chain(getAllSelectors(all)).and(reduce, (isUsed, s) => {
                    if (isUndefined(isUsed[s])) {
                        isUsed[s] = !!document.querySelector(s);
                    }
                    return isUsed;
                }, {}).value(),
                contentType: config.page.contentType || 'unknown',
                breakpoint: detect.getBreakpoint() || 'unknown',
            }), all);
        });
}

function makeSender(all) {
    return debounce((clickSpec) => {
        if (!clickSpec || clickSpec.samePage) {
            setTimeout(() => {
                sendReport(all);
            }, all ? 0 : random(0, 3000));
        }
    }, 500);
}

export default function (all) {
    let sender;

    all = all || window.location.hash === '#csslogging';

    if (all || random(1, 2500) === 1) {
        sender = makeSender(all);
        sender();

        if (!eventsInitialised) {
            mediator.on('module:clickstream:interaction', sender);
            mediator.on('module:clickstream:click', sender);
            eventsInitialised = true;
        }
    }
}
