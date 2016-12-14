/*eslint-disable no-new*/
import qwery from 'qwery';
import bean from 'bean';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import urlutils from 'common/utils/url';
import richLinks from 'common/modules/article/rich-links';
import membershipEvents from 'common/modules/article/membership-events';
import openModule from 'common/modules/article/open-module';
import ab from 'common/modules/experiments/ab';
import geoMostPopular from 'common/modules/onward/geo-most-popular';
import quiz from 'common/modules/atoms/quiz';
import articleLiveblogCommon from 'bootstraps/enhanced/article-liveblog-common';
import trail from 'bootstraps/enhanced/trail';
var modules = {
        initCmpParam: function() {
            var allvars = urlutils.getUrlVars();

            if (allvars.CMP) {
                $('.element-pass-cmp').each(function(el) {
                    el.src = el.src + '?CMP=' + allvars.CMP;
                });
            }
        },

        initRightHandComponent: function() {
            var mainColumn = qwery('.js-content-main-column');
            // only render when we have >1000px or more (enough space for ad + most popular)
            if (mainColumn[0] && mainColumn[0].offsetHeight > 1150 && detect.isBreakpoint({
                    min: 'desktop'
                })) {
                geoMostPopular.render();
            } else {
                mediator.emit('modules:onward:geo-most-popular:cancel');
            }
        },

        initQuizListeners: function() {
            // This event is for older-style quizzes implemented as interactives. See https://github.com/guardian/quiz-builder
            xxxrequirexxx(['ophan/ng'], function(ophan) {
                mediator.on('quiz/ophan-event', ophan.record);
            });
        }
    },

    ready = function() {
        trail();
        articleLiveblogCommon();
        if (!shouldRemoveGeoMostPop()) {
            modules.initRightHandComponent();
        }
        modules.initCmpParam();
        modules.initQuizListeners();
        richLinks.upgradeRichLinks();
        richLinks.insertTagRichLink();
        membershipEvents.upgradeEvents();
        openModule.init();
        mediator.emit('page:article:ready');
        quiz.handleCompletion();
    };

function shouldRemoveGeoMostPop() {
    var testName = 'ItsRainingInlineAds';
    return !config.page.isImmersive && ab.testCanBeRun(testName) && ['nogeo', 'none'].indexOf(ab.getTestVariantId(testName)) > -1;
}

export default {
    init: ready,
    modules: modules // exporting for LiveBlog bootstrap to use
};
