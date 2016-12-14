import reportError from 'common/utils/report-error';
import config from 'common/utils/config';
import cookies from 'common/utils/cookies';
import mediator from 'common/utils/mediator';
import store from 'common/utils/storage';
import mvtCookie from 'common/modules/analytics/mvt-cookie';
import memoize from 'lodash/functions/memoize';
import noop from 'lodash/utilities/noop';
import EditorialEmailVariants from 'common/modules/experiments/tests/editorial-email-variants';
import RecommendedForYou from 'common/modules/experiments/tests/recommended-for-you';
import MembershipEngagementInternationalExperiment from 'common/modules/experiments/tests/membership-engagement-international-experiment';
import ContributionsEpicBrexitSupreme from 'common/modules/experiments/tests/contributions-epic-brexit-supreme';
import ContributionsEpicUsPreEndOfYearTwo from 'common/modules/experiments/tests/contributions-epic-us-pre-end-of-year-two';
import ContributionsEpicAlwaysAskStrategy from 'common/modules/experiments/tests/contributions-epic-always-ask-strategy';
import UkMembershipEngagementMessageTest10 from 'common/modules/experiments/tests/uk-membership-engagement-message-test-10';
import AuMembershipEngagementMessageTest8 from 'common/modules/experiments/tests/au-membership-engagement-message-test-8';
import ItsRainingInlineAds from 'common/modules/experiments/tests/its-raining-inline-ads';
let TESTS = [
    new EditorialEmailVariants(),
    new RecommendedForYou(),
    new MembershipEngagementInternationalExperiment(),
    new ContributionsEpicBrexitSupreme(),
    new ContributionsEpicUsPreEndOfYearTwo(),
    new ContributionsEpicAlwaysAskStrategy(),
    new UkMembershipEngagementMessageTest10(),
    new AuMembershipEngagementMessageTest8(),
    new ItsRainingInlineAds(),
];

const participationsKey = 'gu.ab.participations';

function getParticipations() {
    return store.local.get(participationsKey) || {};
}

function isParticipating(test) {
    const participations = getParticipations();
    return participations[test.id];
}

function addParticipation(test, variantId) {
    const participations = getParticipations();
    participations[test.id] = {
        variant: variantId,
    };
    store.local.set(participationsKey, participations);
}

function removeParticipation(test) {
    const participations = getParticipations();
    const filteredParticipations = Object.keys(participations)
        .filter(participation => participation !== test.id)
        .reduce((result, input) => {
            result[input] = participations[input];
            return result;
        }, {});
    store.local.set(participationsKey, filteredParticipations);
}

function cleanParticipations() {
    // Removes any tests from localstorage that have been
    // renamed/deleted from the backend
    Object.keys(getParticipations()).forEach((k) => {
        if (typeof config.switches[`ab${k}`] === 'undefined') {
            removeParticipation({
                id: k,
            });
        } else {
            const testExists = TESTS.some(element => element.id === k);

            if (!testExists) {
                removeParticipation({
                    id: k,
                });
            }
        }
    });
}

function getActiveTests() {
    const now = new Date();
    return TESTS.filter((test) => {
        const expired = (now - new Date(test.expiry)) > 0;
        if (expired) {
            removeParticipation(test);
            return false;
        }
        return true;
    });
}

function getExpiredTests() {
    const now = new Date();
    return TESTS.filter(test => (now - new Date(test.expiry)) > 0);
}

function testCanBeRun(test) {
    const expired = (new Date() - new Date(test.expiry)) > 0;
    const isSensitive = config.page.isSensitive;

    return ((isSensitive ? test.showForSensitive : true) && isTestSwitchedOn(test)) && !expired && test.canRun();
}

function getId(test) {
    return test.id;
}

function getTest(id) {
    const testIndex = TESTS.map(getId).indexOf(id);
    return testIndex !== -1 ? TESTS[testIndex] : '';
}

function makeOmnitureTag() {
    const participations = getParticipations();
    const tag = [];

    Object.keys(participations)
        .map(getTest)
        .filter(testCanBeRun)
        .forEach((test) => {
            tag.push(`AB | ${test.id} | ${participations[test.id].variant}`);
        });

    Object.keys(config.tests)
        .filter(k => k.toLowerCase().indexOf('cm') === 0)
        .forEach((k) => {
            tag.push(`AB | ${k} | variant`);
        });

    getServerSideTests().forEach((testName) => {
        tag.push(`AB | ${testName} | inTest`);
    });

    return tag.join(',');
}

function abData(variantName, complete) {
    return {
        variantName,
        complete,
    };
}

function getAbLoggableObject() {
    try {
        const log = {};

        getActiveTests()
            .filter(not(defersImpression))
            .filter(isParticipating)
            .filter(testCanBeRun)
            .forEach((test) => {
                const variant = getTestVariantId(test.id);

                if (variant && variant !== 'notintest') {
                    log[test.id] = abData(variant, 'false');
                }
            });

        getServerSideTests().forEach((test) => {
            log[`ab${test}`] = abData('inTest', 'false');
        });

        return log;
    } catch (error) {
        // Encountering an error should invalidate the logging process.
        reportError(error, false);
        return {};
    }
}

function trackEvent() {
    recordOphanAbEvent(getAbLoggableObject());
}

function recordOphanAbEvent(data) {
    require(['ophan/ng'], (ophan) => {
        ophan.record({
            abTestRegister: data,
        });
    });
}

/**
 * Register a test and variant's complete state with Ophan
 *
 * @param test
 * @param {string} variantId
 * @param {boolean} complete
 * @returns {Function} to fire the event
 */
function recordTestComplete(test, variantId, complete) {
    const data = {};
    data[test.id] = abData(variantId, String(complete));

    return () => {
        recordOphanAbEvent(data);
    };
}

// Finds variant in specific tests and runs it
function run(test) {
    if (isParticipating(test) && testCanBeRun(test)) {
        const participations = getParticipations();
        const variantId = participations[test.id].variant;
        const variant = getVariant(test, variantId);
        if (variant) {
            variant.test();
        } else if (variantId === 'notintest' && test.notInTest) {
            test.notInTest();
        }
    }
}

/**
 * Determine whether the user is in the test or not and return the associated
 * variant ID.
 *
 * The test population is just a subset of mvt ids. A test population must
 * begin from a specific value. Overlapping test ranges are permitted.
 *
 * @return {String} variant ID
 */
const variantIdFor = memoize((test) => {
    const smallestTestId = mvtCookie.getMvtNumValues() * test.audienceOffset;
    const largestTestId = smallestTestId + mvtCookie.getMvtNumValues() * test.audience;
    const mvtCookieId = mvtCookie.getMvtValue();

    if (mvtCookieId && mvtCookieId > smallestTestId && mvtCookieId <= largestTestId) {
        // This mvt test id is in the test range, so allocate it to a test variant.
        const variantIds = test.variants.map(getId);

        return variantIds[mvtCookieId % variantIds.length];
    } else {
        return 'notintest';
    }
}, getId); // use test ids as memo cache keys

function allocateUserToTest(test) {
    // Only allocate the user if the test is valid and they're not already participating.
    if (testCanBeRun(test) && !isParticipating(test)) {
        addParticipation(test, variantIdFor(test));
    }
}

/**
 * Create a function that sets up listener to fire an Ophan `complete` event. This is used in the `success` and
 * `impression` properties of test variants to allow test authors to control when these events are sent out.
 *
 * @see {@link defersImpression}
 * @param {Boolean} complete
 * @returns {Function}
 */
function registerCompleteEvent(complete) {
    return function initListener(test) {
        const variantId = variantIdFor(test);

        if (variantId !== 'notintest') {
            const variant = getVariant(test, variantId);
            const listener = (complete ? variant.success : variant.impression) || noop;

            try {
                listener(recordTestComplete(test, variantId, complete));
            } catch (err) {
                reportError(err, false, false);
            }
        }
    };
}

/**
 * Checks if this test will defer its impression by providing its own impression function.
 *
 * If it does, the test won't be included in the Ophan call that happens at pageload, and must fire the impression
 * itself via the callback passed to the `impression` property in the variant.
 *
 * @param test
 * @returns {boolean}
 */
function defersImpression(test) {
    return test.variants.every(variant => typeof variant.impression === 'function');
}

function isTestSwitchedOn(test) {
    return config.switches[`ab${test.id}`];
}

function getTestVariantId(testId) {
    const participation = getParticipations()[testId];
    return participation && participation.variant;
}

function setTestVariant(testId, variant) {
    const participations = getParticipations();

    if (participations[testId]) {
        participations[testId].variant = variant;
        store.local.set(participationsKey, participations);
    }
}

function shouldRunTest(id, variant) {
    const test = getTest(id);
    return test && isParticipating(test) && getTestVariantId(id) === variant && testCanBeRun(test);
}

function getVariant(test, variantId) {
    const index = test.variants.map(getId).indexOf(variantId);
    return index === -1 ? null : test.variants[index];
}

// These kinds of tests are both server and client side.
function getServerSideTests() {
    return Object.keys(config.tests).filter(test => !!config.tests[test]);
}

function not(f) {
    return function (...args) {
        return !f.apply(this, args);
    };
}

const ab = {

    addTest(test) {
        TESTS.push(test);
    },

    clearTests() {
        TESTS = [];
    },

    segment() {
        getActiveTests().forEach((test) => {
            allocateUserToTest(test);
        });
    },

    forceSegment(testId, variant) {
        getActiveTests().filter(test => test.id === testId).forEach((test) => {
            addParticipation(test, variant);
        });
    },

    forceVariantCompleteFunctions(testId, variantId) {
        const test = getTest(testId);

        const variant = test && test.variants.filter(v => v.id.toLowerCase() === variantId.toLowerCase())[0];

        const impression = variant && variant.impression || noop;
        const complete = variant && variant.success || noop;

        impression(recordTestComplete(test, variantId, false));
        complete(recordTestComplete(test, variantId, true));
    },

    segmentUser() {
        let tokens;
        const forceUserIntoTest = /^#ab/.test(window.location.hash);
        if (forceUserIntoTest) {
            tokens = window.location.hash.replace('#ab-', '').split(',');
            tokens.forEach((token) => {
                let abParam;
                let test;
                let variant;
                abParam = token.split('=');
                test = abParam[0];
                variant = abParam[1];
                ab.forceSegment(test, variant);
                ab.forceVariantCompleteFunctions(test, variant);
            });
        } else {
            ab.segment();
        }

        cleanParticipations();
    },

    run() {
        getActiveTests().forEach(run);
    },

    registerCompleteEvents() {
        getActiveTests().forEach(registerCompleteEvent(true));
    },

    registerImpressionEvents() {
        getActiveTests().filter(defersImpression).forEach(registerCompleteEvent(false));
    },

    isEventApplicableToAnActiveTest(event) {
        return Object.keys(getParticipations()).some((id) => {
            const listOfEventStrings = getTest(id).events;
            return listOfEventStrings.some(ev => event.indexOf(ev) === 0);
        });
    },

    getActiveTestsEventIsApplicableTo(event) {
        const eventTag = event.tag;
        return eventTag && getActiveTests().filter((test) => {
            const testEvents = test.events;
            return testEvents && testEvents.some(testEvent => eventTag.indexOf(testEvent) === 0);
        }).map(getId);
    },

    getAbLoggableObject,
    getParticipations,
    isParticipating,
    getTest,
    makeOmnitureTag,
    trackEvent,
    getExpiredTests,
    getActiveTests,
    getTestVariantId,
    setTestVariant,
    getVariant,

    /**
     * check if a test can be run (i.e. is not expired and switched on)
     *
     * @param  {string|Object} test   id or test object
     * @return {Boolean}
     */
    testCanBeRun(test) {
        if (typeof test === 'string') {
            test = getTest(test);
            return test && testCanBeRun(test);
        }

        return test.id && test.expiry && testCanBeRun(test);
    },

    /**
     * returns whether the caller should treat the user as being in that variant.
     *
     * @param testName
     * @param variant
     * @returns {*|boolean|Boolean}
     */
    isInVariant(testName, variant) {
        return ab.getParticipations()[testName] &&
            (ab.getParticipations()[testName].variant === variant) &&
            ab.testCanBeRun(testName);
    },

    shouldRunTest,

    // testing
    reset() {
        TESTS = [];
        variantIdFor.cache = {};
    },
};

export default ab;
