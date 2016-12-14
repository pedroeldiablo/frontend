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

export default function () {
    this.id = 'ContributionsEpicUsPreEndOfYearTwo';
    this.start = '2016-12-12';
    this.expiry = '2016-12-19';
    this.author = 'Guy Dawson';
    this.description = 'Test which Epic variant to use in the US end of year campaign';
    this.showForSensitive = false;
    this.audience = 0.1;
    this.audienceOffset = 0.9;
    this.successMeasure = 'Conversion rate (contributions / impressions)';
    this.audienceCriteria = 'All';
    this.dataLinkNames = '';
    this.idealOutcome = 'We are able to determine which Epic variant to use in the US end of year campaign';
    this.canRun = () => {
        const userHasNeverContributed = !cookies.get('gu.contributions.contrib-timestamp');
        const worksWellWithPageTemplate = (config.page.contentType === 'Article') && !config.page.isMinuteArticle; // may render badly on other types
        return userHasNeverContributed && commercialFeatures.canReasonablyAskForMoney && worksWellWithPageTemplate;
    };

    const makeEvent = name => `${this.id}:${name}`;

    function makeUrl(urlPrefix, intcmp) {
        return `${urlPrefix}INTCMP=${intcmp}`;
    }

    const contributeUrlPrefix = 'co_global_epic_us_pre_end_of_year';
    const membershipUrlPrefix = 'gdnwb_copts_mem_epic_us_pre_end_of_year';

    const epicInsertedEvent = makeEvent('insert');
    const epicViewedEvent = makeEvent('view');

    const membershipUrl = 'https://membership.theguardian.com/supporter?';
    const contributeUrl = 'https://contribute.theguardian.com/?';

    const messages = {
        control: {
            title: 'Since you’re here…',
            p1: '…we have a small favour to ask. More people are reading the Guardian than ever but far fewer are paying for it. And advertising revenues across the media are falling fast. So you can see why we need to ask for your help. The Guardian\'s independent, investigative journalism takes a lot of time, money and hard work to produce. But we do it because we believe our perspective matters – because it might well be your perspective, too.',
            p2: 'If everyone who reads our reporting, who likes it, helps to pay for it our future would be much more secure.',
        },
        endOfYear: {
            title: 'As 2016 comes to a close…',
            p1: '…we would like to ask for your support. More people are reading the Guardian than ever but far fewer are paying for it. And advertising revenues across the media are falling fast. So you can see why now is the right time to ask. The Guardian\'s independent, investigative journalism takes a lot of time, money and hard work to produce. But we do it because we believe our perspective matters – because it might well be your perspective, too.',
            p2: 'If everyone who reads our reporting – who believes in it – helps to support it, our future would be more secure.',
        },
    };

    const cta = {
        equal: {
            p3: '',
            cta1: 'Become a Supporter',
            cta2: 'Make a contribution',
            url1: makeUrl(membershipUrl, membershipUrlPrefix),
            url2: makeUrl(contributeUrl, contributeUrlPrefix),
            hidden: '',
        },

    };

    const componentWriter = component => {
        ajax({
            url: 'https://api.nextgen.guardianapps.co.uk/geolocation',
            method: 'GET',
            contentType: 'application/json',
            crossOrigin: true,
        }).then((resp) => {
            if ('country' in resp && resp.country === 'US') {
                fastdom.write(() => {
                    const submetaElement = $('.submeta');
                    if (submetaElement.length > 0) {
                        component.insertBefore(submetaElement);
                        mediator.emit(epicInsertedEvent, component);
                        $('.contributions__epic').each((element) => {
                            // top offset of 18 ensures view only counts when half of element is on screen
                            const elementInView = ElementInview(element, window, {
                                top: 18,
                            });
                            elementInView.on('firstview', () => {
                                mediator.emit(epicViewedEvent);
                            });
                        });
                    }
                });
            }
        });
    };

    function registerInsertionListener(track) {
        mediator.on(epicInsertedEvent, track);
    }

    function registerViewListener(complete) {
        mediator.on(epicViewedEvent, complete);
    }

    this.variants = [{
        id: 'control',

        test() {
            const ctaType = cta.equal;
            const message = messages.control;
            const component = $.create(template(contributionsEpicEqualButtons, {
                linkUrl1: `${ctaType.url1}_control`,
                linkUrl2: `${ctaType.url2}_control`,
                title: message.title,
                p1: message.p1,
                p2: message.p2,
                p3: ctaType.p3,
                cta1: ctaType.cta1,
                cta2: ctaType.cta2,
                hidden: ctaType.hidden,
            }));
            componentWriter(component);
        },

        impression: registerInsertionListener,

        success: registerViewListener,
    }, {
        id: 'endOfYear',

        test() {
            const ctaType = cta.equal;
            const message = messages.endOfYear;
            const component = $.create(template(contributionsEpicEqualButtons, {
                linkUrl1: `${ctaType.url1}_end_of_year`,
                linkUrl2: `${ctaType.url2}_end_of_year`,
                title: message.title,
                p1: message.p1,
                p2: message.p2,
                p3: ctaType.p3,
                cta1: ctaType.cta1,
                cta2: ctaType.cta2,
                hidden: ctaType.hidden,
            }));
            componentWriter(component);
        },

        impression: registerInsertionListener,

        success: registerViewListener,
    }];
}
