define([
    'common/modules/experiments/segment-util',
    'common/modules/experiments/tests/contributions-epic-brexit',
    'common/modules/experiments/tests/contributions-epic-always-ask-strategy',
], function (
    segmentUtil,
    brexit,
    alwaysAsk
) {
    /**
     * acquisition tests in priority order (highest to lowest)
     */
    var tests = [alwaysAsk, brexit];

    return {
        getTest: function() {
            var eligibleTests = tests.filter(function (test) {
                var t = new test();
                var forced = window.location.hash.indexOf('ab-' + t.id) > -1;

                return forced || (t.canRun() && segmentUtil.isInTest(t));
            });

            return eligibleTests[0] && new eligibleTests[0]();
        }
    }
});
