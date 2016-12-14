import some from 'lodash/collections/some';
import ab from 'common/modules/experiments/ab';


var ContributionsEpicUsaCtaThreeWay = {
    name: 'ContributionsEpicUsaCtaThreeWay',
    variants: ['mixed', 'just-contribute', 'just-supporter']
};

var ContributionsEpicObserverAnniversary = {
    name: 'ContributionsEpicObserverAnniversary',
    variants: ['mixed']
};

var ContributionsEpicBrexitSupreme = {
    name: 'ContributionsEpicBrexitSupreme',
    variants: ['mixed']
};

var ContributionsEpicUsPreEndOfYearTwo = {
    name: 'ContributionsEpicUsPreEndOfYearTwo',
    variants: ['control', 'endOfYear']
};

var ContributionsEpicAlwaysAskStrategy = {
    name: 'ContributionsEpicAlwaysAskStrategy',
    variants: ['control', 'alwaysAsk']
};

function userIsInAClashingAbTest() {
    var clashingTests = [
        ContributionsEpicUsaCtaThreeWay,
        ContributionsEpicObserverAnniversary,
        ContributionsEpicBrexitSupreme,
        ContributionsEpicUsPreEndOfYearTwo,
        ContributionsEpicAlwaysAskStrategy
    ];
    return _testABClash(ab.isInVariant, clashingTests);
}

function _testABClash(f, clashingTests) {
    if (clashingTests.length > 0) {
        return some(clashingTests, function(test) {
            return some(test.variants, function(variant) {
                return f(test.name, variant);
            });
        });
    } else {
        return false;
    }
}

export default {
    userIsInAClashingAbTest: userIsInAClashingAbTest,
    _testABClash: _testABClash // exposed for unit testing
};
