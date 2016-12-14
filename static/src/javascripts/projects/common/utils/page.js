import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import assign from 'lodash/objects/assign';
import find from 'lodash/collections/find';

function isit(isTrue, yes, no, arg) {
    if (isTrue) {
        return yes ? yes((arg || isTrue)) : (arg || isTrue);
    } else {
        return no ? no() : false;
    }
}

function isMatch(yes, no) {
    let teams = config.referencesOfType('pa-football-team');
    let match = config.page.footballMatch || {};

    // the order of this is important as, on occasion,
    // "minbymin" is tagged with "match reports" but should be considered "minbymin".
    assign(match, {
        date: config.webPublicationDateAsUrlPart(),
        teams,
        isLive: config.page.isLive,
        pageType: find([
            ['minbymin', config.page.isLiveBlog],
            ['report', config.hasTone('Match reports')],
            ['preview', config.hasSeries('Match previews')],
            ['stats', match.id],
            [null, true], // We need a default
        ], type => type[1] === true)[0],
    });

    return isit((match.id || (match.pageType && match.teams.length === 2)), yes, no, match);
}

function isCompetition(yes, no) {
    let notMobile = detect.getBreakpoint() !== 'mobile';
    let competition = notMobile ? ($('.js-football-competition').attr('data-link-name') || '').replace('keyword: football/', '') : '';
    return isit(competition, yes, no);
}

function isClockwatch(yes, no) {
    return isit(config.hasSeries('Clockwatch'), yes, no);
}

function isLiveClockwatch(yes, no) {
    return isClockwatch(() => isit(config.page.isLive, yes, no), no);
}

function isFootballStatsPage(yes, no) {
    return isit(config.page.hasOwnProperty('footballMatch'), yes, no);
}

function belowArticleVisible(yes, no) {
    let el = $('.js-after-article')[0];
    let vis = el ? window.getComputedStyle(el).getPropertyValue('display') !== 'none' : false;

    return isit(vis, yes, no, el);
}

function keywordExists(keywordArr) {
    const keywords = config.page.keywords ? config.page.keywords.split(',') : '';

    // Compare page keywords with passed in array
    for (let i = 0; keywordArr.length > i; i++) {
        if (keywords.indexOf(keywordArr[i]) > -1) return true;
    }

    return false;
}

export default {
    isMatch,
    isCompetition,
    isClockwatch,
    isLiveClockwatch,
    isFootballStatsPage,
    belowArticleVisible,
    keywordExists,
}; // define
