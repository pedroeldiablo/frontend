import bean from 'bean';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import getCreativeIDs from 'common/modules/commercial/dfp/get-creative-ids';
import ab from 'common/modules/experiments/ab';
import map from 'lodash/collections/map';
import reduce from 'lodash/collections/reduce';
import assign from 'lodash/objects/assign';
import keys from 'lodash/objects/keys';
import cookies from 'common/utils/cookies';

function objToString(obj) {
    return reduce(obj, (str, value, key) => `${str + key}: ${value}\n`, '');
}

function objToHash(obj) {
    return reduce(obj, (str, value, key) => `${str}&${encodeURIComponent(key)}=${encodeURIComponent(value)}`, '');
}

function addEmailValuesToHash(storedValues) {
    return link => () => {
        const oldHref = link.attr('href');
        const props = {
            page: window.location,
            width: window.innerWidth,
            ads: getCreativeIDs().join(' '),
        };
        const body = objToHash(assign(props, storedValues));
        link.attr('href', `${oldHref}#${body.substring(1)}`);
    };
}

function addEmailHeaders(storedValues) {
    return link => () => {
        const oldHref = link.attr('href');
        const props = {
            browser: window.navigator.userAgent,
            page: window.location,
            width: window.innerWidth,
            adBlock: detect.adblockInUseSync(),
            devicePixelRatio: window.devicePixelRatio,
            ophanId: config.ophan.pageViewId,
            gu_u: cookies.get('GU_U'),
            payingMember: cookies.get('gu_paying_member'),
            abTests: summariseAbTests(ab.getParticipations()),
        };
        const body = `\r\n\r\n\r\n\r\n------------------------------\r\nAdditional technical data about your request - please do not edit:\r\n\r\n${objToString(assign(props, storedValues))}\r\n\r\n`;
        link.attr('href', `${oldHref}?body=${encodeURIComponent(body)}`);
    };
}

function registerHandler(selector, addEmailHeaders) {
    const link = $(selector);

    if (link.length) {
        for (let i = 0; i < link.length; ++i) {
            bean.on(link[i], 'click', addEmailHeaders(link));
        }
    }
}

function getValuesFromHash(hash) {
    const pairs = hash.substring(1).split('&');
    return reduce(pairs, (accu, pairJoined) => {
        const pair = pairJoined.split('=');
        const object = {};
        if (!!pair[0] && !!pair[1]) {
            object[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            return assign(accu, object);
        } else {
            return accu;
        }
    }, {});
}

function summariseAbTests(testParticipations) {
    const tests = keys(testParticipations);
    if (tests.length === 0) {
        return 'No tests running';
    } else {
        return map(tests, (testKey) => {
            const test = testParticipations[testKey];
            return `${testKey}=${test.variant}`;
        }).join(', ');
    }
}

/**
 * the link in the footer adds some of the values to the hash so feedback can use it later.  Those values
 * override those at the time the email is sent.
 */
export default function () {
    const storedValues = getValuesFromHash(window.location.hash);
    registerHandler('.js-tech-feedback-report', addEmailValuesToHash(storedValues));
    registerHandler('.js-tech-feedback-mailto', addEmailHeaders(storedValues));
    registerHandler('[href=mailto:userhelp@theguardian.com]', addEmailHeaders(storedValues));
    registerHandler('[href=mailto:crosswords.beta@theguardian.com]', addEmailHeaders(storedValues)); // FIXME should have used a .js- selector

    // Exposed for testing
    this.getValuesFromHash = getValuesFromHash;
    this.summariseAbTests = summariseAbTests;
}
