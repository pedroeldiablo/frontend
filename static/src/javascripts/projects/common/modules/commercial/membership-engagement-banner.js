import bean from 'bean';
import qwery from 'qwery';
import config from 'common/utils/config';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import Message from 'common/modules/ui/message';
import messageTemplate from 'text!common/views/membership-message.html';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import userFeatures from 'common/modules/commercial/user-features';
import mediator from 'common/utils/mediator';
import Promise from 'Promise';
import fastdom from 'common/utils/fastdom-promise';
import ab from 'common/modules/experiments/ab';
import $ from 'common/utils/$';
import svgs from 'common/views/svgs';

const endpoints = {
    UK: 'https://membership.theguardian.com/uk/supporter',
    US: 'https://contribute.theguardian.com',
    AU: 'https://membership.theguardian.com/au/supporter',
    INT: 'https://membership.theguardian.com/supporter',
};

// change messageCode to force redisplay of the message to users who already closed it.
// messageCode is also consumed by .../test/javascripts/spec/common/commercial/membership-engagement-banner.spec.js
const messageCode = 'engagement-banner-2016-11-10';
const notInTest = 'notintest';

const messages = {
    UK: {
        campaign: 'mem_uk_banner',
        messageText: 'For less than the price of a coffee a week, you could help secure the Guardian’s future. Support our journalism for £5 a month.',
        buttonCaption: 'Become a Supporter',
    },
    US: {
        campaign: 'mem_us_banner',
        messageText: 'If you use it, if you like it, then why not pay for it? It’s only fair.',
        buttonCaption: 'Make a Contribution',
    },
    AU: {
        campaign: 'mem_au_banner',
        messageText: 'We need you to help support our fearless independent journalism. Become a Guardian Australia Member for just $100 a year.',
        buttonCaption: 'Become a Supporter',
    },
    INT: {
        campaign: 'mem_int_banner',
        messageText: 'The Guardian’s voice is needed now more than ever. Support our journalism for just $69/€49 per year.',
        buttonCaption: 'Become a Supporter',
    },
};

function doInternationalTest(content) {
    const variant = getVariant('MembershipEngagementInternationalExperiment');
    if (variant && variant !== notInTest) {
        const campaignCode = `gdnwb_copts_mem_banner_ROWbanner__${variant}`;
        content.campaignCode = campaignCode;
        content.linkHref = formatEndpointUrl('INT', campaignCode);
    }
}

function doUkCopyTest(content) {
    const variant = getVariant('UkMembEngagementMsgCopyTest10');
    if (variant && variant !== notInTest) {
        const variantMessages = {
            post_truth_world: 'In a post-truth world, facts matter more than ever. Support the Guardian for £5 a month',
            now_is_the_time: 'If you’ve been thinking about supporting us, now is the time to do it. Support the Guardian for £5 a month',
            everyone_chipped_in: 'Not got around to supporting us yet? If everyone chipped in, our future would be more secure. Support the Guardian for £5 a month',
            free_and_open: 'By giving £5 a month you can help to keep the Guardian’s journalism free and open for all',
        };
        const campaignCode = `gdnwb_copts_mem_banner_ukbanner__${variant}`;
        content.campaignCode = campaignCode;
        content.linkHref = formatEndpointUrl('UK', campaignCode);
        if (variant !== 'control') {
            content.messageText = variantMessages[variant];
        }
    }
}

function doAuCopyTest(content) {
    const variant = getVariant('AuMembEngagementMsgCopyTest8');
    if (variant && variant !== notInTest) {
        const variantMessages = {
            fearless_10: 'We need you to help support our fearless independent journalism. Become a Guardian Australia member for just $10 a month',
            stories_that_matter: 'We need your help to tell the stories that matter. Support Guardian Australia now',
            power_to_account: 'We need your help to hold power to account. Become a Guardian Australia supporter',
            independent_journalism: 'Support quality, independent journalism in Australia by becoming a member',
        };
        const campaignCode = `gdnwb_copts_mem_banner_aubanner__${variant}`;
        content.campaignCode = campaignCode;
        content.linkHref = formatEndpointUrl('AU', campaignCode);
        if (variant !== 'control') {
            content.messageText = variantMessages[variant];
        }
    }
}

function show(edition, message) {
    const content = {
        linkHref: formatEndpointUrl(edition, message.campaign),
        messageText: message.messageText,
        campaignCode: message.campaign,
        buttonCaption: message.buttonCaption,
        colourClass: thisInstanceColour(),
        arrowWhiteRight: svgs('arrowWhiteRight'),
    };

    doInternationalTest(content);
    doUkCopyTest(content);
    doAuCopyTest(content);

    const renderedBanner = template(messageTemplate, content);
    const messageShown = new Message(
        messageCode, {
            pinOnHide: false,
            siteMessageLinkName: 'membership message',
            siteMessageCloseBtn: 'hide',
            siteMessageComponentName: content.campaignCode,
            trackDisplay: true,
            cssModifierClass: `membership-prominent ${content.colourClass}`,
        }).show(renderedBanner);
    if (messageShown) {
        mediator.emit('membership-message:display');
    }
    mediator.emit('banner-message:complete');
    return messageShown;
}

function init() {
    const edition = config.page.edition;
    const message = messages[edition];
    if (message) {
        if (userHasMadeEnoughVisits(edition)) {
            return commercialFeatures.async.canDisplayMembershipEngagementBanner.then((canShow) => {
                if (canShow) {
                    show(edition, message);
                }
            });
        }
    }
    return Promise.resolve();
}

function userHasMadeEnoughVisits(edition) {
    if (edition === 'INT') {
        const internationalTestVariant = getVariant('MembershipEngagementInternationalExperiment');
        if (internationalTestVariant == '1st_article') {
            return true;
        }
    }

    return (storage.local.get('gu.alreadyVisited') || 0) >= 10;
}

function formatEndpointUrl(edition, campaignCode) {
    return `${endpoints[edition]}?INTCMP=${campaignCode}`;
}

function thisInstanceColour() {
    const colours = ['yellow', 'purple', 'bright-blue', 'dark-blue'];
    // Rotate through different colours on successive page views
    return colours[storage.local.get('gu.alreadyVisited') % colours.length];
}

function getVariant(variantName) {
    return ab.testCanBeRun(variantName) ? ab.getTestVariantId(variantName) : undefined;
}

export default {
    init,
    messageCode,
};
