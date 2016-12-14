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
import intersection from 'lodash/arrays/intersection';

export default function () {
    this.id = 'ContributionsEpicBrexitSupreme';
    this.start = '2016-12-02';
    this.expiry = '2016-12-16';
    this.author = 'Phil Wills';
    this.description = 'Appeal linked to the Brexit appeal in the Supreme Court';
    this.showForSensitive = false;
    this.audience = 0.88;
    this.audienceOffset = 0;
    this.successMeasure = 'N/A';
    this.audienceCriteria = 'All';
    this.dataLinkNames = '';
    this.idealOutcome = 'We receive contributions and membership sign-ups';
    this.canRun = () => {
        const includedKeywordIds = ['politics/eu-referendum'];

        const includedSeriesIds = [];

        const excludedKeywordIds = [];

        const excludedSeriesIds = ['theobserver/series/the-observer-at-225'];

        const tagsMatch = () => {
            const pageKeywords = config.page.keywordIds;
            if (typeof (pageKeywords) !== 'undefined') {
                const keywordList = pageKeywords.split(',');
                return intersection(excludedKeywordIds, keywordList).length == 0 &&
                    excludedSeriesIds.indexOf(config.page.seriesId) === -1 &&
                    (intersection(includedKeywordIds, keywordList).length > 0 || includedSeriesIds.indexOf(config.page.seriesId) !== -1);
            } else {
                return false;
            }
        };

        const userHasNeverContributed = !cookies.get('gu.contributions.contrib-timestamp');
        const worksWellWithPageTemplate = (config.page.contentType === 'Article') && !config.page.isMinuteArticle; // may render badly on other types
        return userHasNeverContributed && commercialFeatures.canReasonablyAskForMoney && worksWellWithPageTemplate && tagsMatch();
    };

    const contributeUrlPrefix = 'co_global_epic_brexit_supreme';
    const membershipUrlPrefix = 'gdnwb_copts_mem_epic_brexit_supreme';


    const makeUrl = (urlPrefix, intcmp) => `${urlPrefix}INTCMP=${intcmp}`;

    const membershipUrl = 'https://membership.theguardian.com/supporter?';
    const contributeUrl = 'https://contribute.theguardian.com/?';

    const messages = {
        control: {
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
                mediator.emit('contributions-embed:insert', component);
            }
        });
    };

    const completer = complete => {
        mediator.on('contributions-embed:view', complete);
    };

    this.variants = [{
        id: 'mixed',

        test() {
            const ctaType = cta.equal;
            const message = messages.control;
            const component = $.create(template(contributionsEpicEqualButtons, {
                linkUrl1: `${ctaType.url1}_mixed`,
                linkUrl2: `${ctaType.url2}_mixed`,
                title: message.title,
                p1: message.p1,
                p2: ctaType.p2,
                p3: ctaType.p3,
                cta1: ctaType.cta1,
                cta2: ctaType.cta2,
                hidden: ctaType.hidden,
            }));
            componentWriter(component);
        },

        impression(track) {
            mediator.on('contributions-embed:insert', track);
        },

        success: completer,
    }];
}
