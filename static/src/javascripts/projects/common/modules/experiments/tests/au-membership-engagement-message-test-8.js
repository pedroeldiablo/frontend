import bean from 'bean';
import reqwest from 'reqwest';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import mediator from 'common/utils/mediator';
export default function () {
    this.id = 'AuMembEngagementMsgCopyTest8';
    this.start = '2016-11-24';
    this.expiry = '2017-1-5';
    this.author = 'Justin Pinner';
    this.description = 'Test alternate short messages on AU engagement banner (test 8)';
    this.audience = 1; // 100% (of AU audience)
    this.audienceOffset = 0;
    this.successMeasure = 'Membership conversions';
    this.audienceCriteria = '100 percent of (non-member) AU edition readers';
    this.dataLinkNames = '';
    this.idealOutcome = 'We will see a 50 percent uplift in conversions through the engagement banner';
    this.hypothesis = 'More persuasive copy will improve membership conversions from impressions';

    this.canRun = function () {
        return config.page.edition.toLowerCase() === 'au' &&
            commercialFeatures.canReasonablyAskForMoney &&
            config.page.contentType.toLowerCase() !== 'signup';
    };

    const success = function (complete) {
        if (this.canRun()) {
            mediator.on('membership-message:display', () => {
                bean.on(qwery('#membership__engagement-message-link')[0], 'click', complete);
            });
        }
    };

    this.variants = [{
        id: 'control',
        test() {},
        success: success.bind(this),
    }, {
        id: 'fearless_10',
        test() {},
        success: success.bind(this),
    }, {
        id: 'stories_that_matter',
        test() {},
        success: success.bind(this),
    }, {
        id: 'power_to_account',
        test() {},
        success: success.bind(this),
    }, {
        id: 'independent_journalism',
        test() {},
        success: success.bind(this),
    }];
}
