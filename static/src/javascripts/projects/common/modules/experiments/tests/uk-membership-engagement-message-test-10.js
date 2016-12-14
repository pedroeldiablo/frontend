import bean from 'bean';
import reqwest from 'reqwest';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import mediator from 'common/utils/mediator';
export default function () {
    this.id = 'UkMembEngagementMsgCopyTest10';
    this.start = '2016-11-23';
    this.expiry = '2016-12-8';
    this.author = 'Justin Pinner';
    this.description = 'Test alternate short messages on engagement banner (test 10)';
    this.audience = 1; // 100% (of UK audience)
    this.audienceOffset = 0;
    this.successMeasure = 'Membership conversions';
    this.audienceCriteria = '100 percent of (non-member) UK edition readers';
    this.dataLinkNames = '';
    this.idealOutcome = 'We will see a 50 percent uplift in conversions through the engagement banner';
    this.hypothesis = 'More persuasive copy will improve membership conversions from impressions';

    this.canRun = () => config.page.edition.toLowerCase() === 'uk' &&
        commercialFeatures.canReasonablyAskForMoney &&
        config.page.contentType.toLowerCase() !== 'signup';

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
        id: 'post_truth_world',
        test() {},
        success: success.bind(this),
    }, {
        id: 'now_is_the_time',
        test() {},
        success: success.bind(this),
    }, {
        id: 'everyone_chipped_in',
        test() {},
        success: success.bind(this),
    }, {
        id: 'free_and_open',
        test() {},
        success: success.bind(this),
    }];
}
