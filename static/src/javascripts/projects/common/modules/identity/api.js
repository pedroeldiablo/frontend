/* global escape:true */
import ajax from 'common/utils/ajax';
import utilAtob from 'common/utils/atob';
import config from 'common/utils/config';
import cookies from 'common/utils/cookies';
import mediator from 'common/utils/mediator';
import storage from 'common/utils/storage';
import asyncCallMerger from 'common/modules/asyncCallMerger';
import Promise from 'Promise';

/**
 * Left this as an object as there are only static methods
 * We'll need to change this once there is some state change
 * TODO(jamesgorrie): Allow this to show policies too (not needed yet)
 */
let Id = {};

let userFromCookieCache = null;

Id.cookieName = 'GU_U';
Id.signOutCookieName = 'GU_SO';
Id.fbCheckKey = 'gu.id.nextFbCheck';
Id.lastRefreshKey = 'identity.lastRefresh';
Id.idApiRoot = null;
Id.idUrl = null;

Id.init = () => {
    Id.idApiRoot = config.page.idApiUrl;
    Id.idUrl = config.page.idUrl;
    mediator.emit('module:identity:api:loaded');
};

/**
 * Clears the caches and state, primarily for testing.
 */
Id.reset = () => {
    Id.getUserFromApi.reset();
    userFromCookieCache = null;
};

/**
 * The object returned from the cookie has the keys:
 *
 * {
 *    id
 *    primaryEmailAddress
 *    displayName
 *    accountCreatedDate
 *    emailVerified
 *    rawResponse
 * };
 *
 * @return {?Object} the user information
 */
Id.getUserFromCookie = () => {
    if (userFromCookieCache === null) {
        let cookieData = cookies.get(Id.cookieName);
        let userData = cookieData ? JSON.parse(Id.decodeBase64(cookieData.split('.')[0])) : null;
        if (userData) {
            const displayName = decodeURIComponent(userData[2]);
            userFromCookieCache = {
                id: userData[0],
                primaryEmailAddress: userData[1], // not sure where this is stored now - not in the cookie any more
                displayName,
                accountCreatedDate: userData[6],
                emailVerified: userData[7],
                rawResponse: cookieData,
            };
        }
    }

    return userFromCookieCache;
};

/**
 * @return {string}
 */
Id.getCookie = () => cookies.get(Id.cookieName);

/**
 * @return {boolean}
 */
Id.isUserLoggedIn = () => Id.getUserFromCookie() !== null;

/**
 * @return {string}
 */
Id.getUrl = () => Id.idUrl;

/**
 * Gets the currently logged in user data from the identity api
 * @param {function} callback
 */
Id.getUserFromApi = asyncCallMerger.mergeCalls(
    (mergingCallback) => {
        if (Id.isUserLoggedIn()) {
            ajax({
                url: `${Id.idApiRoot}/user/me`,
                type: 'jsonp',
                crossOrigin: true,
            }).then(
                (response) => {
                    if (response.status === 'ok') {
                        mergingCallback(response.user);
                    } else {
                        mergingCallback(null);
                    }
                }
            );
        } else {
            mergingCallback(null);
        }
    }
);

/**
 * Gets the currently logged in user data from the identity api and
 * refreshes the users cookie at the same time.
 */
Id.getUserFromApiWithRefreshedCookie = () => {
    let endpoint = '/user/me';

    let request = ajax({
        url: Id.idApiRoot + endpoint,
        type: 'jsonp',
        data: {
            refreshCookie: true,
        },
    });

    return request;
};

/**
 * Returns user object when signed in, otherwise redirects to sign in with configurable absolute returnUrl
 */
Id.getUserOrSignIn = returnUrl => {
    if (Id.isUserLoggedIn()) {
        return Id.getUserFromCookie();
    } else {
        returnUrl = encodeURIComponent(returnUrl || document.location.href);
        const url = `${Id.getUrl()}/signin?returnUrl=${returnUrl}`;
        Id.redirectTo(url);
    }
};

/**
 * Wrap window.location.href so it can be spied in unit tests
 */
Id.redirectTo = url => {
    window.location.href = url;
};

/**
 * Handles unicode chars correctly
 * @param {string} str
 * @return {string}
 */
Id.decodeBase64 = str => decodeURIComponent(escape(utilAtob(str.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '='))));

/**
 * @return {Boolean}
 */
Id.hasUserSignedOutInTheLast24Hours = () => {
    const cookieData = cookies.get(Id.signOutCookieName);

    if (cookieData) {
        return ((Math.round(new Date().getTime() / 1000)) < (parseInt(cookieData, 10) + 86400));
    }
    return false;
};

/**
 * Returns true if a there is no signed in user and the user has not signed in the last 24 hours
 */
Id.shouldAutoSigninInUser = function () {
    let signedInUser = !!cookies.get(Id.cookieName);
    let checkFacebook = !!storage.local.get(Id.fbCheckKey);
    return !signedInUser && !checkFacebook && !this.hasUserSignedOutInTheLast24Hours();
};

Id.setNextFbCheckTime = nextFbCheckDue => {
    storage.local.set(Id.fbCheckKey, {}, {
        expires: nextFbCheckDue,
    });
};

Id.emailSignup = listId => {
    let endpoint = `/useremails/${Id.getUserFromCookie().id}/subscriptions`;

    let data = {
        listId,
    };

    let request = ajax({
        url: Id.idApiRoot + endpoint,
        type: 'jsonp',
        crossOrigin: true,
        data: {
            body: JSON.stringify(data),
            method: 'post',
        },
    });

    return request;
};

Id.getUserEmailSignUps = () => {
    if (Id.getUserFromCookie()) {
        let endpoint = `/useremails/${Id.getUserFromCookie().id}`;

        let request = ajax({
            url: Id.idApiRoot + endpoint,
            type: 'jsonp',
            crossOrigin: true,
        });

        return request;
    }

    return Promise.resolve(null);
};

Id.sendValidationEmail = () => {
    let endpoint = '/user/send-validation-email';

    let request = ajax({
        url: Id.idApiRoot + endpoint,
        type: 'jsonp',
        crossOrigin: true,
        data: {
            method: 'post',
        },
    });

    return request;
};

Id.getSavedArticles = () => {
    let endpoint = '/syncedPrefs/me/savedArticles';

    let request = ajax({
        url: Id.idApiRoot + endpoint,
        type: 'jsonp',
        crossOrigin: true,
    });

    return request;
};

Id.saveToArticles = data => {
    let endpoint = '/syncedPrefs/cors/me/savedArticles';

    let request = ajax({
        url: Id.idApiRoot + endpoint,
        type: 'json',
        crossOrigin: true,
        method: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        withCredentials: true,
        headers: {
            'X-GU-ID-Client-Access-Token': `Bearer ${config.page.idApiJsClientToken}`,
        },
    });

    return request;
};

export default Id;
