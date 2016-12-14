/* eslint-disable no-new*/
/* TODO - fix module constructors */
import fastdom from 'fastdom';
import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import cookies from 'common/utils/cookies';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import url from 'common/utils/url';
import robust from 'common/utils/robust';
import storage from 'common/utils/storage';
import Foresee from 'common/modules/analytics/foresee-survey';
import mediaListener from 'common/modules/analytics/media-listener';
import interactionTracking from 'common/modules/analytics/interaction-tracking';
import register from 'common/modules/analytics/register';
import ScrollDepth from 'common/modules/analytics/scrollDepth';
import logCss from 'common/modules/analytics/css-logging';
import simpleMetrics from 'common/modules/analytics/simple-metrics';
import userAdTargeting from 'common/modules/commercial/user-ad-targeting';
import donotUseAdblock from 'common/modules/commercial/donot-use-adblock';
import userFeatures from 'common/modules/commercial/user-features';
import CommentCount from 'common/modules/discussion/comment-count';
import AutoSignin from 'common/modules/identity/autosignin';
import CookieRefresh from 'common/modules/identity/cookierefresh';
import navigation from 'common/modules/navigation/navigation';
import Profile from 'common/modules/navigation/profile';
import Search from 'common/modules/navigation/search';
import membership from 'common/modules/navigation/membership';
import history from 'common/modules/onward/history';
import MoreTags from 'common/modules/onward/more-tags';
import techFeedback from 'common/modules/onward/tech-feedback';
import accessibilityPrefs from 'common/modules/ui/accessibility-prefs';
import Clickstream from 'common/modules/ui/clickstream';
import Dropdowns from 'common/modules/ui/dropdowns';
import fauxBlockLink from 'common/modules/ui/faux-block-link';
import Message from 'common/modules/ui/message';
import cookiesBanner from 'common/modules/ui/cookiesBanner';
import RelativeDates from 'common/modules/ui/relativedates';
import customSmartAppBanner from 'common/modules/ui/smartAppBanner';
import Tabs from 'common/modules/ui/tabs';
import Toggles from 'common/modules/ui/toggles';
import userPrefs from 'common/modules/user-prefs';
import breakingNews from 'common/modules/onward/breaking-news';
import pinterest from 'common/modules/social/pinterest';
import hiddenShareToggle from 'common/modules/social/hidden-share-toggle';
import SaveForLater from 'common/modules/save-for-later';
import membershipEngagementBanner from 'common/modules/commercial/membership-engagement-banner';
import email from 'common/modules/email/email';
import emailArticle from 'common/modules/email/email-article';
import identity from 'bootstraps/enhanced/identity-common';
import forEach from 'lodash/collections/forEach';
const modules = {
    initialiseTopNavItems() {
        let profile;
        const search = new Search();
        const header = document.getElementById('header');

        if (header) {
            if (config.switches.idProfileNavigation) {
                profile = new Profile({
                    url: config.page.idUrl,
                });
                profile.init();
            }
        }

        search.init(header);
    },

    initialiseNavigation() {
        navigation.init();
    },

    showTabs() {
        const tabs = new Tabs();
        ['modules:popular:loaded', 'modules:geomostpopular:ready'].forEach((event) => {
            mediator.on(event, (el) => {
                tabs.init(el);
            });
        });
    },

    showToggles() {
        const toggles = new Toggles();
        toggles.init(document);
        toggles.reset();
        Dropdowns.init();
    },

    showRelativeDates() {
        const dates = RelativeDates;
        dates.init();
    },

    initClickstream() {
        new Clickstream({
            filter: ['a', 'button'],
        });
    },

    showAdblockMessage() {
        donotUseAdblock.init();
    },

    loadAnalytics() {
        interactionTracking.init();
        if (config.switches.ophan) {
            require(['ophan/ng'], (ophan) => {
                if (config.switches.scrollDepth) {
                    mediator.on('scrolldepth:data', ophan.record);

                    new ScrollDepth({
                        isContent: /Article|LiveBlog/.test(config.page.contentType),
                    });
                }
            });
        }
    },

    cleanupCookies() {
        cookies.cleanUp(['mmcore.pd', 'mmcore.srv', 'mmid', 'GU_ABFACIA', 'GU_FACIA', 'GU_ALPHA', 'GU_ME', 'at', 'gu_adfree_user']);
    },

    cleanupLocalStorage() {
        const deprecatedKeys = [
            'gu.subscriber',
            'gu.contributor',
            'gu.abb3.exempt',
        ];
        forEach(deprecatedKeys, storage.remove);
    },

    updateHistory() {
        if (config.page.contentType !== 'Network Front') {
            history.logSummary(config.page);
        }

        history.logHistory(config.page);
    },

    showHistoryInMegaNav() {
        if (config.switches.historyTags) {
            mediator.once('modules:nav:open', () => {
                history.showInMegaNav();
            });
        }
    },

    initAutoSignin() {
        if (config.switches.facebookAutosignin && detect.getBreakpoint() !== 'mobile') {
            new AutoSignin().init();
        }
    },

    idCookieRefresh() {
        if (config.switches.idCookieRefresh) {
            new CookieRefresh().init();
        }
    },

    windowEventListeners() {
        ['resize', 'scroll', 'orientationchange'].forEach((event) => {
            bean.on(window, event, mediator.emit.bind(mediator, `window:${event}`));
        });
    },

    checkIframe() {
        if (window.self !== window.top) {
            $('html').addClass('iframed');
        }
    },

    runForseeSurvey() {
        if (config.switches.foresee) {
            Foresee.load();
        }
    },

    startRegister() {
        register.initialise();
    },

    showMoreTagsLink() {
        new MoreTags().init();
    },

    initDiscussion() {
        if (config.switches.discussion) {
            CommentCount.init();
        }
    },

    testCookie() {
        const queryParams = url.getUrlVars();
        if (queryParams.test) {
            cookies.addSessionCookie('GU_TEST', encodeURIComponent(queryParams.test));
        }
    },

    initOpenOverlayOnClick() {
        let offset;

        bean.on(document.body, 'click', '[data-open-overlay-on-click]', (e) => {
            const elId = bonzo(e.currentTarget).data('open-overlay-on-click');
            offset = document.body.scrollTop;
            bonzo(document.body).addClass('has-overlay');
            $(`#${elId}`).addClass('overlay--open').appendTo(document.body);
        });

        bean.on(document.body, 'click', '.js-overlay-close', (e) => {
            const overlay = $.ancestor(e.target, 'overlay');
            if (overlay) {
                bonzo(overlay).removeClass('overlay--open');
            }
            bonzo(document.body).removeClass('has-overlay');
            if (offset) {
                window.setTimeout(() => {
                    document.body.scrollTop = offset;
                    offset = null;
                }, 1);
            }
        });
    },

    loadBreakingNews() {
        if (config.switches.breakingNews && config.page.section !== 'identity' && !config.page.isHosted) {
            breakingNews().catch(() => {
                // breaking news may not load if local storage is unavailable - this is fine
            });
        }
    },

    runCssLogging() {
        if (config.switches.cssLogging) {
            logCss();
        }
    },

    initPublicApi() {
        // BE CAREFUL what you expose here...
        window.guardian.api = {
            logCss,
        };
    },

    initPinterest() {
        if (/Article|LiveBlog|Gallery|Video/.test(config.page.contentType)) {
            pinterest();
        }
    },


    saveForLater() {
        if (config.switches.saveForLater) {
            const saveForLater = new SaveForLater();
            saveForLater.conditionalInit();
        }
    },

    membershipEngagementBanner() {
        if (config.switches.membershipEngagementBanner) {
            membershipEngagementBanner.init();
        }
    },

    initEmail() {
        // Initalise email embedded in page
        email.init();

        // Initalise email insertion into articles
        if (config.switches.emailInArticle) {
            emailArticle.init();
        }

        // Initalise email forms in iframes
        forEach(document.getElementsByClassName('js-email-sub__iframe'), (el) => {
            email.init(el);
        });

        // Listen for interactive load event and initalise forms
        bean.on(window, 'interactive-loaded', () => {
            forEach(qwery('.guInteractive .js-email-sub__iframe'), (el) => {
                email.init(el);
            });
        });
    },
};
export default {
    init() {
        forEach(robust.makeBlocks([

            // Analytics comes at the top. If you think your thing is more important then please think again...
            ['c-analytics', modules.loadAnalytics],

            ['c-cookies-banner', cookiesBanner.init],
            ['c-identity', identity],
            ['c-adverts', userAdTargeting.requestUserSegmentsFromId],
            ['c-discussion', modules.initDiscussion],
            ['c-test-cookie', modules.testCookie],
            ['c-event-listeners', modules.windowEventListeners],
            ['c-breaking-news', modules.loadBreakingNews],
            ['c-block-link', fauxBlockLink],
            ['c-iframe', modules.checkIframe],
            ['c-tabs', modules.showTabs],
            ['c-top-nav', modules.initialiseTopNavItems],
            ['c-init-nav', modules.initialiseNavigation],
            ['c-toggles', modules.showToggles],
            ['c-dates', modules.showRelativeDates],
            ['c-clickstream', modules.initClickstream],
            ['c-history', modules.updateHistory],
            ['c-sign-in', modules.initAutoSignin],
            ['c-id-cookie-refresh', modules.idCookieRefresh],
            ['c-history-nav', modules.showHistoryInMegaNav],
            ['c-forsee', modules.runForseeSurvey],
            ['c-start-register', modules.startRegister],
            ['c-tag-links', modules.showMoreTagsLink],
            ['c-smart-banner', customSmartAppBanner.init],
            ['c-adblock', modules.showAdblockMessage],
            ['c-cookies', modules.cleanupCookies],
            ['c-localStorage', modules.cleanupLocalStorage],
            ['c-overlay', modules.initOpenOverlayOnClick],
            ['c-css-logging', modules.runCssLogging],
            ['c-public-api', modules.initPublicApi],
            ['c-simple-metrics', simpleMetrics],
            ['c-tech-feedback', techFeedback],
            ['c-media-listeners', mediaListener],
            ['c-accessibility-prefs', accessibilityPrefs],
            ['c-pinterest', modules.initPinterest],
            ['c-hidden-share-toggle', hiddenShareToggle],
            ['c-save-for-later', modules.saveForLater],
            ['c-show-membership-engagement-banner', modules.membershipEngagementBanner],
            ['c-email', modules.initEmail],
            ['c-user-features', userFeatures.refresh.bind(userFeatures)],
            ['c-membership', membership],

        ]), (fn) => {
            fn();
        });
    },
};
