import bean from 'bean';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
import storage from 'common/utils/storage';
import config from 'common/utils/config';
import template from 'common/utils/template';
import svg from 'common/views/svg';
import mediator from 'common/utils/mediator';
import history from 'common/modules/onward/history';
import ajax from 'common/utils/ajax';
import recommendedForYouTemplate from 'text!common/views/experiments/recommended-for-you.html';
import profileIcon from 'inlineSvg!svgs/icon/profile-36';
import rightArrowIcon from 'inlineSvg!svgs/icon/arrow-right';
import guardianLogo from 'inlineSvg!svgs/icon/marque-36';
import fetch from 'common/utils/fetch';
export default function () {
    this.id = 'RecommendedForYouRecommendations';
    this.start = '2016-08-02';
    this.expiry = '2016-12-23';
    this.author = 'Joseph Smith';
    this.description = 'Add a personalised container to fronts';
    this.audience = 0;
    this.audienceOffset = 0;
    this.successMeasure = 'Visit frequency';
    this.audienceCriteria = 'All users';
    this.dataLinkNames = '';
    this.idealOutcome = 'People will visit more often';

    const endpoint = 'https://engine.mobile-aws.guardianapis.com/recommendations';
    const cachedRecommendationsKey = 'gu.cachedRecommendations';
    const numberOfRecommendations = 4;

    let $opinionSection;
    let $recommendedForYouSection;

    this.canRun = () => {
        $opinionSection = $('#opinion');
        return config.page.contentType === 'Network Front' && $opinionSection.length;
    };

    this.variants = [{
        id: 'user-history',
        test() {
            populateRecommendationsContainer();
        },
    }, {
        id: 'control',
        test() {},
    }];

    function populateRecommendationsContainer() {
        const recommendations = storage.local.get(cachedRecommendationsKey);
        if (recommendations && new Date(recommendations.expiry) > new Date()) {
            insertSection(recommendations.items);
        } else {
            const promisedRecommendations = getRemoteRecommendations();
            promisedRecommendations.then(cacheRecommendations);
            promisedRecommendations.then(insertSection);
        }
    }

    function getRemoteRecommendations() {
        const reqBody = {
            pageSize: numberOfRecommendations,
            articles: history.test.getHistory().map(item => item[0]),
        };

        const request = fetch(endpoint, {
            type: 'json',
            method: 'post',
            crossOrigin: true,
            body: JSON.stringify(reqBody),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return request.then(response => response.json().then(body => body.content.slice(0, numberOfRecommendations).map(itemFromRecommendationItem)));
    }

    function cacheRecommendations(items) {
        const expiry = new Date();
        expiry.setTime(expiry.getTime() + 21600000);
        storage.local.set(cachedRecommendationsKey, {
            expiry,
            items,
        });
    }

    function imageUrlFromItem(item) {
        function imageFromTemplate(img) {
            return img.replace('#{width}', 220).replace('#{height}', 146).replace('#{quality}', 0.8);
        }
        if (item.headerImage) {
            return imageFromTemplate(item.headerImage.urlTemplate);
        } else if (item.headerVideo) {
            return imageFromTemplate(item.headerVideo.stillImage.urlTemplate);
        } else {
            return null;
        }
    }

    function itemFromRecommendationItem(item) {
        return {
            id: item.item.id,
            imageUrl: imageUrlFromItem(item.item),
            title: item.item.title,
            standFirst: item.item.standFirst,
        };
    }

    function setupComponentAttentionTracking(trackingCode) {
        require(['ophan/ng'], (ophan) => {
            ophan.trackComponentAttention(trackingCode, $recommendedForYouSection[0]);
        });
    }

    function insertSection(items) {
        $recommendedForYouSection = $.create(template(recommendedForYouTemplate, {
            profileIcon: svg(profileIcon, ['rounded-icon', 'rfy-profile-icon', 'control__icon-wrapper']),
            guardianLogo: svg(guardianLogo),
            items,
        }));

        return fastdom.write(() => {
            $recommendedForYouSection.insertBefore($opinionSection);
            setupComponentAttentionTracking('recommended-for-you_user-history');
            mediator.emit('recommended-for-you:insert');
        });
    }
}
