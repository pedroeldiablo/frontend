import config from 'common/utils/config';
import urlUtils from 'common/utils/url';

const gatewayUrl = '//pq-direct.revsci.net/pql';
const sectionPlacements = {
    sport: ['FKSWod', '2xivTZ', 'MTLELH'],
    football: ['6FaXJO', 'ORE2W-', 'MTLELH'],
    lifeandstyle: ['TQV1_5', 'J0tykU', 'kLC9nW', 'MTLELH'],
    technology: ['9a9VRE', 'TL3gqK', 'MTLELH'],
    fashion: ['TQV1_5', 'J0tykU', 'kLC9nW', 'MTLELH'],
    news: ['eMdl6Y', 'mMYVrM', 'MTLELH'],
    default: ['FLh9mM', 'c7Zrhu', 'Y1C40a', 'LtKGsC', 'MTLELH'],
};
let section = sectionPlacements[config.page.section] ? config.page.section : 'default';
const audienceSciencePqlUrl = getUrl();

function getUrl() {
    const placements = sectionPlacements[section];
    const query = urlUtils.constructQuery({
        placementIdList: placements.join(','),
        cb: new Date().getTime(),
    });
    return `${gatewayUrl}?${query}`;
}

function onLoad() {
    window.googletag.cmd.push(
        setAudienceScienceCallback,
        setAudienceScienceKeys
    );
}

function getSegments() {
    const placements = window.asiPlacements || {};
    return Object.keys(placements)
        .filter(placement => placements[placement].default)
        .map(placement => `pq_${placement}`);
}

function setAudienceScienceKeys() {
    getSegments().forEach(addKey);
}

// Remove all Audience Science related targeting keys as soon as we recieve
// an AS creative (will get called by the creative itself)
function setAudienceScienceCallback() {
    window.onAudienceScienceCreativeLoaded = function () {
        getSegments().forEach(removeKey);
    };
}

function addKey(key) {
    window.googletag.pubads().setTargeting(key, 'T');
}

function removeKey(key) {
    window.googletag.pubads().clearTargeting(key);
}

export default {
    shouldRun: config.page.edition === 'UK' && config.switches.audienceScienceGateway,
    url: audienceSciencePqlUrl,
    reset() {
        section = sectionPlacements[config.page.section] ? config.page.section : 'default';
    },
    onLoad,
    getSegments,
};
