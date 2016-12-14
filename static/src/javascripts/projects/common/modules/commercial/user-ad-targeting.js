import storage from 'common/utils/storage';
import time from 'common/utils/time';
import id from 'common/modules/identity/api';
const userSegmentsKey = 'gu.ads.userSegmentsData';

function getUserSegments() {
    if (storage.local.isAvailable()) {
        let userCookieData,
            userSegmentsData = storage.local.get(userSegmentsKey);

        if (userSegmentsData) {
            userCookieData = id.getUserFromCookie();

            if (userCookieData && (userSegmentsData.userHash === (userCookieData.id % 9999))) {
                return userSegmentsData.segments;
            } else {
                storage.local.remove(userSegmentsKey);
            }
        }
    }

    return [];
}

function requestUserSegmentsFromId() {
    if (storage.local.isAvailable() && (storage.local.get(userSegmentsKey) === null) && id.getUserFromCookie()) {
        id.getUserFromApi((user) => {
            if (user && user.adData) {
                let key,
                    userSegments = [];
                for (key in user.adData) {
                    userSegments.push(key + user.adData[key]);
                }
                storage.local.set(
                    userSegmentsKey, {
                        segments: userSegments,
                        userHash: user.id % 9999,
                    }, {
                        expires: time.currentDate().getTime() + (24 * 60 * 60 * 1000),
                    }
                );
            }
        });
    }
}

export default {
    getUserSegments,
    requestUserSegmentsFromId,
};
