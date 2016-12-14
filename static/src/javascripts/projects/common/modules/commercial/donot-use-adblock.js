import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import mediator from 'common/utils/mediator';
import adblockMsg from 'common/modules/commercial/adblock-messages';
import adblockConfig from 'common/modules/commercial/adblock-banner-config';
import AdblockBanner from 'common/modules/adblock-banner';
import history from 'common/modules/onward/history';
import Message from 'common/modules/ui/message';
import navigation from 'common/modules/navigation/navigation';
import messageTemplate from 'text!common/views/membership-message.html';
import svgs from 'common/views/svgs';
import sample from 'lodash/collections/sample';

function showAdblockMessage() {
    var adblockLink = 'https://membership.theguardian.com/supporter',
        messages = {
            UK: {
                campaign: 'ADB_UK',
                messageText: [
                    'We notice you\'re using an ad-blocker. Perhaps you\'ll support us another way?',
                    'Become a Supporter for less than £1 per week'
                ].join(' '),
                linkText: 'Find out more'
            },
            US: {
                campaign: 'ADB_US',
                messageText: [
                    'We notice you\'re using an ad-blocker. Perhaps you\'ll support us another way?',
                    'Become a Supporter for less than $1 per week'
                ].join(' '),
                linkText: 'Find out more'
            },
            INT: {
                campaign: 'ADB_INT',
                messageText: [
                    'We notice you\'re using an ad-blocker. Perhaps you\'ll support us another way?',
                    'Become a Supporter for less than $1/€1 per week'
                ].join(' '),
                linkText: 'Find out more'
            }
        },
        message = messages[config.page.edition];

    if (message) {
        new Message('adblock-message-2016-06-15', {
            pinOnHide: false,
            siteMessageLinkName: 'adblock',
            siteMessageCloseBtn: 'hide',
            cssModifierClass: 'adblock-message'
        }).show(template(messageTemplate, {
            linkHref: adblockLink + '?INTCMP=' + message.campaign,
            messageText: message.messageText,
            linkText: message.linkText,
            arrowWhiteRight: svgs('arrowWhiteRight')
        }));
    }
}

function showAdblockBanner() {
    var banners = adblockConfig.getBanners(config.page.edition);

    var flatBanners = [];
    banners.forEach(function(bannerList) {
        flatBanners.push(sample(bannerList));
    });

    var bannerToUse = sample(flatBanners);

    if (bannerToUse) {
        new AdblockBanner(bannerToUse.template, bannerToUse).show();
    }
}

function init() {
    // Show messages only if adblock is used by non paying member
    if (adblockMsg.showAdblockMsg()) {
        showAdblockMessage();
        showAdblockBanner();
    }
    mediator.emit('banner-message:complete');
}

export default {
    init: init
};
