import some from 'lodash/collections/some';
import ab from 'common/modules/experiments/ab';


const ContributionsEpicUsaCtaThreeWay = {
    name: 'ContributionsEpicUsaCtaThreeWay',
    variants: ['mixed', 'just-contribute', 'just-supporter'],
};

const ContributionsEpicObserverAnniversary = {
    name: 'ContributionsEpicObserverAnniversary',
    variants: ['mixed'],
};

const ContributionsEpicBrexitSupreme = {
    name: 'ContributionsEpicBrexitSupreme',
    variants: ['mixed'],
};

const ContributionsEpicUsPreEndOfYearTwo = {
    name: 'ContributionsEpicUsPreEndOfYearTwo',
    variants: ['control', 'endOfYear'],
};

const ContributionsEpicAlwaysAskStrategy = {
    name: 'ContributionsEpicAlwaysAskStrategy',
    variants: ['control', 'alwaysAsk'],
};

function userIsInAClashingAbTest() {
    const clashingTests = [
        ContributionsEpicUsaCtaThreeWay,
        ContributionsEpicObserverAnniversary,
        ContributionsEpicBrexitSupreme,
        ContributionsEpicUsPreEndOfYearTwo,
        ContributionsEpicAlwaysAskStrategy,
    ];
    return _testABClash(ab.isInVariant, clashingTests);
}

function _testABClash(f, clashingTests) {
    if (clashingTests.length > 0) {
        return some(clashingTests, test => some(test.variants, variant => f(test.name, variant)));
    } else {
        return false;
    }
}

export default {
    userIsInAClashingAbTest,
    _testABClash, // exposed for unit testing
};
