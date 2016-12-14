import bean from 'bean';
import qwery from 'qwery';
import $ from 'common/utils/$';
import template from 'common/utils/template';
import svg from 'common/views/svg';
import fastdom from 'common/utils/fastdom-promise';
import mediator from 'common/utils/mediator';
import contributionsEpicEqualButtons from 'text!common/views/contributions-epic-equal-buttons.html';
import robust from 'common/utils/robust';
import arrowRight from 'inlineSvg!svgs/icon/arrow-right';
import config from 'common/utils/config';
import cookies from 'common/utils/cookies';
import ajax from 'common/utils/ajax';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import ElementInview from 'common/utils/element-inview';

// We want to ensure the test always runs as this enables an easy data lake query to see whether a reader is in the
// test segment: check whether the ab_tests field contains a test with name ContributionsEpicAlwaysAskStrategy.
// This means having showForSensitive equal to true, and the canRun() function always returning true.
// The logic for whether the test-variant is displayed, is handled in the canBeDisplayed() function.
export default function () {
    this.id = 'ContributionsEpicAlwaysAskStrategy';
    this.start = '2016-12-06';
    this.expiry = '2017-01-06';
    this.author = 'Guy Dawson';
    this.description = 'Test to assess the effects of always asking readers to contribute via the Epic over a prolonged period.';
    this.showForSensitive = true;
    this.audience = 0.02;
    this.audienceOffset = 0.88;
    this.successMeasure = 'We are able to measure the positive and negative effects of this strategy.';
    this.audienceCriteria = 'All';
    this.dataLinkNames = '';
    this.idealOutcome = 'There are no negative effects and this is the optimum strategy!';
    this.canRun = () => true;

    const makeEvent = name => `${this.id}:${name}`;

    function makeUrl(urlPrefix, intcmp) {
        return `${urlPrefix}INTCMP=${intcmp}`;
    }

    const contributeUrlPrefix = 'co_global_epic_always_ask_strategy';
    const membershipUrlPrefix = 'gdnwb_copts_mem_epic_always_ask_strategy';

    const epicViewedEvent = makeEvent('view');

    const membershipUrl = 'https://membership.theguardian.com/supporter?';
    const contributeUrl = 'https://contribute.theguardian.com/?';

    const messages = {
        alwaysAsk: {
            title: 'Since you’re here …',
            p1: '…we have a small favour to ask. More people are reading the Guardian than ever but far fewer are paying for it. And advertising revenues across the media are falling fast. So you can see why we need to ask for your help. The Guardian\'s independent, investigative journalism takes a lot of time, money and hard work to produce. But we do it because we believe our perspective matters – because it might well be your perspective, too.',
        },
    };

    const cta = {
        equal: {
            p2: 'If everyone who reads our reporting, who likes it, helps to pay for it, our future would be much more secure.',
            p3: '',
            cta1: 'Become a Supporter',
            cta2: 'Make a contribution',
            url1: makeUrl(membershipUrl, membershipUrlPrefix),
            url2: makeUrl(contributeUrl, contributeUrlPrefix),
            hidden: '',
        },
    };

    const componentWriter = component => {
        fastdom.write(() => {
            const submetaElement = $('.submeta');
            if (submetaElement.length > 0) {
                component.insertBefore(submetaElement);
                $('.contributions__epic').each((element) => {
                    // top offset of 18 ensures view only counts when half of element is on screen
                    const elementInview = ElementInview(element, window, {
                        top: 18,
                    });
                    elementInview.on('firstview', () => {
                        mediator.emit(epicViewedEvent);
                    });
                });
            }
        });
    };

    const registerViewListener = complete => {
        mediator.on(epicViewedEvent, complete);
    };

    const canBeDisplayed = () => {
        const userHasNeverContributed = !cookies.get('gu.contributions.contrib-timestamp');
        const worksWellWithPageTemplate = (config.page.contentType === 'Article') && !config.page.isMinuteArticle; // may render badly on other types
        const isSensitive = config.page.isSensitive === true;
        return userHasNeverContributed &&
            commercialFeatures.canReasonablyAskForMoney &&
            worksWellWithPageTemplate &&
            !isSensitive;
    };

    this.variants = [{
        id: 'control',

        test() {},

        success: registerViewListener,
    }, {
        id: 'alwaysAsk',

        test() {
            if (canBeDisplayed()) {
                const ctaType = cta.equal;
                const message = messages.alwaysAsk;
                const component = $.create(template(contributionsEpicEqualButtons, {
                    linkUrl1: `${ctaType.url1}_always_ask`,
                    linkUrl2: `${ctaType.url2}_always_ask`,
                    title: message.title,
                    p1: message.p1,
                    p2: ctaType.p2,
                    p3: ctaType.p3,
                    cta1: ctaType.cta1,
                    cta2: ctaType.cta2,
                    hidden: ctaType.hidden,
                }));
                componentWriter(component);
            }
        },

        success: registerViewListener,
    }];
}
