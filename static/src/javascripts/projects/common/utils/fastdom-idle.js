import fastdom from 'fastdom';
import userPrefs from 'common/modules/user-prefs';

function idleFastdom(action, callback) {
    if (userPrefs.get('use-idle-callback') && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
            fastdom[action](callback);
        });
    } else {
        fastdom[action](callback);
    }
}

export default {
    read(callback) {
        idleFastdom('read', callback);
    },
    write(callback) {
        idleFastdom('write', callback);
    },
};
