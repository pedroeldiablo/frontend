import fastdom from 'fastdom';
import bean from 'bean';
import qwery from 'qwery';
import raven from 'common/utils/raven';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import userTiming from 'common/utils/user-timing';
import robust from 'common/utils/robust';
import ab from 'common/modules/experiments/ab';
import common from './common';
import sport from './sport';
import ga from 'common/modules/analytics/google';
export default function () {
    const bootstrapContext = (featureName, bootstrap) => {
        raven.context({
            tags: {
                feature: featureName,
            },
        },
            bootstrap.init, []
        );
    };


    userTiming.mark('App Begin');
    robust.catchErrorsAndLog('ga-user-timing-enhanced-start', () => {
        ga.trackPerformance('Javascript Load', 'enhancedStart', 'Enhanced start parse time');
    });

    bootstrapContext('common', common);

    //
    // A/B tests
    //

    robust.catchErrorsAndLog('ab-tests', () => {
        ab.segmentUser();

        robust.catchErrorsAndLog('ab-tests-run', ab.run);
        robust.catchErrorsAndLog('ab-tests-registerImpressionEvents', ab.registerImpressionEvents);
        robust.catchErrorsAndLog('ab-tests-registerCompleteEvents', ab.registerCompleteEvents);

        ab.trackEvent();
    });

    // Front
    if (config.page.isFront) {
        require(['bootstraps/enhanced/facia'], (facia) => {
            bootstrapContext('facia', facia);
        });
    }

    if (config.page.section === 'lifeandstyle' && config.page.series === 'Sudoku') {
        require(['bootstraps/enhanced/sudoku'], (sudoku) => {
            bootstrapContext('sudoku', sudoku);
        });
    }

    if (config.page.contentType === 'Article' && !config.page.isMinuteArticle) {
        require(['bootstraps/enhanced/article', 'bootstraps/enhanced/image-content'], (article, imageContent) => {
            bootstrapContext('article', article);
            bootstrapContext('article : image-content', imageContent);
        });
    }

    if (config.page.contentType === 'Crossword') {
        require(['bootstraps/enhanced/crosswords'], (crosswords) => {
            bootstrapContext('crosswords', crosswords);
        });
    }

    if (config.page.contentType === 'LiveBlog') {
        require(['bootstraps/enhanced/liveblog', 'bootstraps/enhanced/image-content'], (liveBlog, imageContent) => {
            bootstrapContext('liveBlog', liveBlog);
            bootstrapContext('liveBlog : image-content', imageContent);
        });
    }

    if (config.page.isMinuteArticle) {
        require(['bootstraps/enhanced/article-minute', 'bootstraps/enhanced/image-content'], (articleMinute, imageContent) => {
            bootstrapContext('articleMinute', articleMinute);
            bootstrapContext('article : image-content', imageContent);
        });
    }

    if (config.isMedia || config.page.contentType === 'Interactive') {
        require(['bootstraps/enhanced/trail'], (trail) => {
            bootstrapContext('media : trail', {
                init: trail,
            });
        });
    }

    if ((config.isMedia || qwery('video, audio').length) && !config.page.isHosted) {
        require(['bootstraps/enhanced/media/main'], (media) => {
            bootstrapContext('media', media);
        });
    }

    if (config.page.contentType === 'Gallery') {
        require(['bootstraps/enhanced/gallery', 'bootstraps/enhanced/image-content'], (gallery, imageContent) => {
            bootstrapContext('gallery', gallery);
            bootstrapContext('gallery : image-content', imageContent);
        });
    }

    if (config.page.contentType === 'ImageContent') {
        require(['bootstraps/enhanced/image-content', 'bootstraps/enhanced/trail'], (imageContent, trail) => {
            bootstrapContext('image-content', imageContent);
            bootstrapContext('image-content : trail', {
                init: trail,
            });
        });
    }

    if (config.page.section === 'football') {
        require(['bootstraps/enhanced/football'], (football) => {
            bootstrapContext('football', football);
        });
    }

    if (config.page.section === 'sport') {
        // Leaving this here for now as it's a tiny bootstrap.
        bootstrapContext('sport', sport);
    }

    if (config.page.section === 'identity') {
        require(['bootstraps/enhanced/profile'], (profile) => {
            bootstrapContext('profile', profile);
        });
    }

    if (config.page.isPreferencesPage) {
        require(['bootstraps/enhanced/preferences'], (preferences) => {
            bootstrapContext('preferences', preferences);
        });
    }

    if (config.page.section === 'newsletter-signup-page') {
        require(['bootstraps/enhanced/signup'], (signup) => {
            bootstrapContext('signup', signup);
        });
    }

    // use a #force-sw hash fragment to force service worker registration for local dev
    if ((window.location.protocol === 'https:' && config.page.section !== 'identity') || window.location.hash === '#force-sw') {
        const navigator = window.navigator;
        if (navigator && navigator.serviceWorker) {
            navigator.serviceWorker.register('/service-worker.js');
        }
    }

    if (config.page.pageId === 'help/accessibility-help') {
        require(['bootstraps/enhanced/accessibility'], (accessibility) => {
            bootstrapContext('accessibility', accessibility);
        });
    }

    fastdom.read(() => {
        if ($('.youtube-media-atom').length > 0) {
            require(['bootstraps/enhanced/youtube'], (youtube) => {
                bootstrapContext('youtube', youtube);
            });
        }
    });

    // Mark the end of synchronous execution.
    userTiming.mark('App End');
    robust.catchErrorsAndLog('ga-user-timing-enhanced-end', () => {
        ga.trackPerformance('Javascript Load', 'enhancedEnd', 'Enhanced end parse time');
    });
}
