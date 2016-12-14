import userPrefs from 'common/modules/user-prefs';
const KEY_PREFIX = 'accessibility';

function saveState(state) {
    for (const key in state) {
        if (state.hasOwnProperty(key)) {
            userPrefs.set(`${KEY_PREFIX}.${key}`, state[key]);
        }
    }
}

function getStoredValue(key) {
    const stored = userPrefs.get(`${KEY_PREFIX}.${key}`);
    // Defaults to true
    return stored === false ? false : true;
}

function isOn(key) {
    return getStoredValue(key) === true;
}

const module = {
    KEY_PREFIX,
    saveState,
    isOn,
};
export default module;
