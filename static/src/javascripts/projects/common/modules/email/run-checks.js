import $ from 'common/utils/$';
import page from 'common/utils/page';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import storage from 'common/utils/storage';
import robust from 'common/utils/robust';
import some from 'lodash/collections/some';
import every from 'lodash/collections/every';
import map from 'lodash/collections/map';
import contains from 'lodash/collections/contains';
import userPrefs from 'common/modules/user-prefs';
import Id from 'common/modules/identity/api';
import clash from 'common/modules/experiments/ab-test-clash';
import Promise from 'Promise';
let emailInserted = false;
let emailShown;
let userListSubsChecked = false;
let userListSubs = [];

function pageHasBlanketBlacklist() {
    // Prevent the blanket emails from ever showing on certain keywords or sections
    return page.keywordExists(['US elections 2016', 'Football']) ||
        config.page.section === 'film' ||
        config.page.seriesId === 'world/series/guardian-morning-briefing';
}

function userHasRemoved(id, formType) {
    const currentListPrefs = userPrefs.get(`email-sign-up-${formType}`);
    return currentListPrefs && currentListPrefs.indexOf(id) > -1;
}

function userHasSeenThisSession() {
    return !!storage.session.get('email-sign-up-seen');
}

function buildUserSubscriptions(response) {
    if (response && response.status !== 'error' && response.result && response.result.subscriptions) {
        userListSubs = map(response.result.subscriptions, 'listId');
        userListSubsChecked = true;
    }

    return userListSubs;
}

function userReferredFromNetworkFront() {
    // Check whether the referring url ends in the edition
    const networkFront = ['uk', 'us', 'au', 'international'];

    const originPathName = document.referrer.split(/\?|#/)[0];

    if (originPathName) {
        return some(networkFront, frontName => originPathName.substr(originPathName.lastIndexOf('/') + 1) === frontName);
    }

    return false;
}

function isParagraph($el) {
    return $el.nodeName && $el.nodeName === 'P';
}

function allowedArticleStructure() {
    const $articleBody = $('.js-article__body');

    if ($articleBody.length) {
        const allArticleEls = $('> *', $articleBody);
        return every([].slice.call(allArticleEls, allArticleEls.length - 2), isParagraph);
    } else {
        return false;
    }
}

function obWidgetIsShown() {
    const $outbrain = $('.js-outbrain-container');
    return $outbrain && $outbrain.length > 0;
}

const canRunList = {
    theCampaignMinute() {
        const isUSElection = page.keywordExists(['US elections 2016']);
        const isNotUSBriefingSeries = config.page.series !== 'Guardian US briefing';
        return isUSElection && isNotUSBriefingSeries;
    },
    theFilmToday() {
        return config.page.section === 'film';
    },
    theFiver() {
        return page.keywordExists(['Football']) && allowedArticleStructure();
    },
    labNotes() {
        return config.page.section === 'science' && config.switches.emailSignupLabNotes;
    },
    euRef() {
        return config.switches.emailSignupEuRef &&
            page.keywordExists(['EU referendum']) &&
            allowedArticleStructure();
    },
    usBriefing() {
        return (config.page.section === 'us-news' && allowedArticleStructure()) ||
            config.page.series === 'Guardian US briefing';
    },
    theGuardianToday() {
        return config.switches.emailInArticleGtoday &&
            !pageHasBlanketBlacklist() &&
            userReferredFromNetworkFront() &&
            allowedArticleStructure();
    },
};

// Public

function setEmailInserted() {
    emailInserted = true;
}

function getEmailInserted() {
    return emailInserted;
}

function setEmailShown(emailName) {
    emailShown = emailName;
}

function getEmailShown() {
    return emailShown;
}

function allEmailCanRun() {
    const browser = detect.getUserAgent.browser;
    const version = detect.getUserAgent.version;

    return !config.page.shouldHideAdverts &&
        !config.page.isSensitive &&
        !emailInserted &&
        !config.page.isFront &&
        config.switches.emailInArticle &&
        !clash.userIsInAClashingAbTest() &&
        storage.session.isAvailable() &&
        !userHasSeenThisSession() &&
        !obWidgetIsShown() &&
        !(browser === 'MSIE' && contains(['7', '8', '9'], `${version}`));
}

function getUserEmailSubscriptions() {
    if (userListSubsChecked) {
        return Promise.resolve(userListSubs);
    } else {
        return Id.getUserEmailSignUps()
            .then(buildUserSubscriptions)
            .catch((error) => {
                robust.log('c-email', error);
            });
    }
}

function listCanRun(listConfig) {
    if (listConfig.listName &&
        canRunList[listConfig.listName]() &&
        !contains(userListSubs, listConfig.listId) &&
        !userHasRemoved(listConfig.listId, 'article')) {
        return listConfig;
    }
}

export default {
    setEmailShown,
    getEmailShown,
    setEmailInserted,
    getEmailInserted,
    allEmailCanRun,
    getUserEmailSubscriptions,
    listCanRun,
};
