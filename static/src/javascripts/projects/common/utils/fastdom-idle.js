import fastdom from 'fastdom';
import userPrefs from 'common/modules/user-prefs';

function idleFastdom(action, callback) {
    if (userPrefs.get('use-idle-callback') && 'requestIdleCallback' in window) {
        window.requestIdleCallback(function() {
            fastdom[action](callback);
        });
    } else {
        fastdom[action](callback);
    }
}

export default {
    read: function(callback) {
        idleFastdom('read', callback);
    },
    write: function(callback) {
        idleFastdom('write', callback);
    }
};
