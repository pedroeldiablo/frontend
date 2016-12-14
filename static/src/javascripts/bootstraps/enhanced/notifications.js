import bonzo from 'bonzo';
import qwery from 'qwery';
import bean from 'bean';
import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import storage from 'common/utils/storage';
import ajax from 'common/utils/ajax';
import template from 'common/utils/template';
import robust from 'common/utils/robust';
import svgs from 'common/views/svgs';
import userPrefs from 'common/modules/user-prefs';
import googleAnalytics from 'common/modules/analytics/google';
import followLink from 'text!common/views/ui/notifications-follow-link.html';
import explainer from 'text!common/views/ui/notifications-explainer.html';
import permissionsTemplate from 'text!common/views/ui/notifications-permission-denied-message.html';
import some from 'lodash/collections/some';
import uniq from 'lodash/arrays/uniq';
import without from 'lodash/arrays/without';
import isEmpty from 'lodash/objects/isEmpty';
const modules = {

    getReg() {
        return navigator.serviceWorker.ready;
    },

    getSub() {
        // This function can change Notification.permission
        // by asking the user if it is in 'default' state.
        return modules.getReg().then(reg => reg.pushManager.getSubscription());
    },

    init() {
        modules.addButtonPromise().then(() => {
            const $followElement = modules.configureSubscribeButton();
            modules.trackFollowButtonAttention($followElement.get(0));
        });
    },

    addButtonPromise() {
        const button = '<button class="js-notifications__toggle notifications__toggle notifications-follow-input--solo"></button><span class="live-notifications__label js-live-notifications__label--denied live-notifications__label--hidden">Oops! You need to <a href="https://support.google.com/chrome/answer/3220216">unblock notifications</a> for www.theguardian.com</span>';
        const $container = $('.js-live-notifications');
        return fastdom.write(() => {
            $container.append(button);
        });
    },

    trackFollowButtonAttention(followElement) {
        if (followElement) {
            require(['ophan/ng'], (ophan) => {
                ophan.trackComponentAttention('web-notifications--follow-button', followElement);
            });
        }
    },

    configureSubscribeButton() {
        let $follow = $('.js-notifications__toggle');
        let isSubscribed = modules.checkSubscriptions();
        let handler = isSubscribed ? modules.unSubscribeHandler : modules.subscribeHandler;

        let src = template(followLink, {
            isSubscribed,
            icon: svgs(isSubscribed ? 'notificationsOff' : 'notificationsOn'),
        });

        if (!isEmpty($follow)) {
            fastdom.write(() => {
                if (isSubscribed) {
                    $follow.attr('data-link-name', 'live-blog-notifications-turned-off');
                } else {
                    $follow.attr('data-link-name', 'live-blog-notifications-turned-on');
                }

                $follow.html(src);
                bean.one($follow[0], 'click', handler);
            });
        }
        return $follow;
    },

    subscribeHandler() {
        const wasNotGranted = Notification.permission !== 'granted';
        modules.subscribe().then(modules.follow)
            .then(() => {
                const isNowGranted = Notification.permission === 'granted';
                if (wasNotGranted && isNowGranted) {
                    googleAnalytics.trackNonClickInteraction('browser-notifications-granted');
                }
            }).catch(() => {
                if (Notification.permission === 'denied') {
                    googleAnalytics.trackNonClickInteraction('browser-notifications-denied');
                }
                modules.configureSubscribeButton();
            });
    },

    unSubscribeHandler() {
        modules.unFollow().then(modules.unSubscribe);
    },

    subscribe() {
        return modules.getReg().then(reg => modules.getSub().then((sub) => {
            if (sub) {
                return sub;
            } else {
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                });
            }
        }).catch((e) => {
            fastdom.write(() => {
                const $denied = $('.js-live-notifications__label--denied');
                $denied.removeClass('live-notifications__label--hidden');
                $denied.addClass('live-notifications__label--visible');
            });
            throw e;
        }));
    },

    follow() {
        const endpoint = '/notification/store';

        modules.updateSubscription(endpoint).then(
            () => {
                const subscriptions = modules.getSubscriptions();
                subscriptions.push(config.page.pageId);
                userPrefs.set('subscriptions', uniq(subscriptions));
                modules.configureSubscribeButton();
            }
        );
    },

    unSubscribe() {
        if (modules.subscriptionsEmpty()) {
            modules.getSub().then((sub) => {
                sub.unsubscribe().catch((error) => {
                    robust.log('07cm-frontendNotificatons', error);
                });
            });
        }
        modules.configureSubscribeButton();
    },

    unFollow() {
        const notificationsEndpoint = '/notification/delete';
        return modules.updateSubscription(notificationsEndpoint).then(
            () => {
                let subscriptions = modules.getSubscriptions();
                let newSubscriptions = without(subscriptions, config.page.pageId);
                userPrefs.set('subscriptions', uniq(newSubscriptions));
            }
        );
    },

    updateSubscription(notificationsEndpoint) {
        return modules.getSub().then((sub) => {
            const endpoint = sub && sub.endpoint;
            if (endpoint) {
                return ajax({
                    url: notificationsEndpoint,
                    method: 'POST',
                    contentType: 'application/x-www-form-urlencoded',
                    data: {
                        browserEndpoint: endpoint,
                        notificationTopicId: config.page.pageId,
                    },
                });
            }
        });
    },

    hasSubscribed() {
        return userPrefs.get('subscriptions');
    },

    getSubscriptions() {
        return modules.hasSubscribed() || [];
    },

    subscriptionsEmpty() {
        const subscriptions = modules.getSubscriptions();
        return subscriptions.length ? false : true;
    },

    checkSubscriptions() {
        const subscriptions = modules.getSubscriptions();
        return some(subscriptions, sub => sub == config.page.pageId);
    },
};

export default {
    init: modules.init,
};
