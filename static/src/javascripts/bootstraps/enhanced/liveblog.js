import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import richLinks from 'common/modules/article/rich-links';
import Affix from 'common/modules/experiments/affix';
import AutoUpdate from 'common/modules/ui/autoupdate';
import NotificationCounter from 'common/modules/ui/notification-counter';
import RelativeDates from 'common/modules/ui/relativedates';
import ab from 'common/modules/experiments/ab';
import articleLiveblogCommon from 'bootstraps/enhanced/article-liveblog-common';
import trail from 'bootstraps/enhanced/trail';
import notifications from 'bootstraps/enhanced/notifications';
import robust from 'common/utils/robust';


var modules;

modules = {
    affixTimeline: function() {
        var topMarker;
        if (detect.isBreakpoint({
                min: 'desktop'
            }) && config.page.keywordIds.indexOf('football/football') < 0 && config.page.keywordIds.indexOf('sport/rugby-union') < 0) {
            topMarker = document.querySelector('.js-top-marker');
            new Affix({
                element: document.querySelector('.js-live-blog__sticky-components-container'),
                topMarker: topMarker,
                bottomMarker: document.querySelector('.js-bottom-marker'),
                containerElement: document.querySelector('.js-live-blog__sticky-components')
            });
        }
    },

    createAutoUpdate: function() {
        if (config.page.isLive) {
            AutoUpdate();
        }
    },

    keepTimestampsCurrent: function() {
        var dates = RelativeDates;
        window.setInterval(
            function() {
                dates.init();
            },
            60000
        );
    },

    notificationsCondition: function() {
        return (config.switches.liveBlogChromeNotificationsProd && !detect.isIOS() && (window.location.protocol === 'https:' || window.location.hash === '#force-sw') && detect.getUserAgent.browser === 'Chrome' && config.page.isLive);
    },

    initNotifications: function() {
        if (modules.notificationsCondition()) {
            notifications.init();
        }
    }
};

function ready() {
    robust.catchErrorsAndLogAll([
        ['lb-autoupdate', modules.createAutoUpdate],
        ['lb-timeline', modules.affixTimeline],
        ['lb-timestamp', modules.keepTimestampsCurrent],
        ['lb-notifications', modules.initNotifications],
        ['lb-richlinks', richLinks.upgradeRichLinks]
    ]);

    trail();
    articleLiveblogCommon();

    robust.catchErrorsAndLog('lb-ready', function() {
        mediator.emit('page:liveblog:ready');
    });
}

export default {
    init: ready,
    notificationsCondition: modules.notificationsCondition
};
