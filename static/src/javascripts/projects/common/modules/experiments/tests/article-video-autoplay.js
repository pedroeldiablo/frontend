define([
    'common/utils/detect'
], function (detect) {

    return function () {
        this.id = 'ArticleVideoAutoplay';
        this.start = '2016-03-07';
        this.expiry = '2016-03-21';
        this.author = 'James Gorrie';
        this.description = 'Autoplay embedded videos on article pages';
        this.audience = .2;
        this.audienceOffset = .8;
        this.successMeasure = 'More video watched when embedded in articles';
        this.audienceCriteria = '';
        this.dataLinkNames = '';
        this.idealOutcome = 'People are more engaged with video when embedded in article pages';

        this.canRun = function () {
            var bp = detect.getBreakpoint();
            return !(bp === 'mobile' || bp === 'mobileLandscape');
        };

        this.variants = [{
            id: 'noautoplay',
            test: function () {}
        }, {
            id: 'autoplay',
            test: function () {}
        }];

    };

});