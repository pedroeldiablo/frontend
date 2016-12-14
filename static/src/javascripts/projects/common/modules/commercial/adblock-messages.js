import config from 'common/utils/config';
import detect from 'common/utils/detect';
import storage from 'common/utils/storage';
import userFeatures from 'common/modules/commercial/user-features';

function adblockInUseSync() {
    return detect.adblockInUseSync();
}

function notMobile() {
    return detect.getBreakpoint() !== 'mobile';
}

function isPayingMember() {
    return userFeatures.isPayingMember();
}

function visitedMoreThanOnce() {
    const alreadyVisited = storage.local.get('gu.alreadyVisited') || 0;

    return alreadyVisited > 1;
}

function isAdblockSwitchOn() {
    return config.switches.adblock;
}

function noAdblockMsg() {
    return adblockInUseSync() && notMobile() && (!visitedMoreThanOnce() ||
        !isAdblockSwitchOn() ||
        (isAdblockSwitchOn() && visitedMoreThanOnce() && isPayingMember()));
}

function showAdblockMsg() {
    return isAdblockSwitchOn() &&
        adblockInUseSync() &&
        !isPayingMember() &&
        visitedMoreThanOnce() &&
        notMobile();
}

export default {
    noAdblockMsg,
    showAdblockMsg,
};
