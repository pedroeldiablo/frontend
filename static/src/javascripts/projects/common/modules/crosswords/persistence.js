import storage from 'common/utils/storage';
import map from 'lodash/collections/map';
const localStorage = storage.local;

const localStorageKey = id => `crosswords.${id}`;

function saveGridState(id, grid) {
    /**
     * Take only the entries from the grid. Other state information like what cells are highlighted ought not
     * to be persisted.
     */
    const entries = map(grid, row => map(row, cell => cell.value));

    try {
        return localStorage.set(localStorageKey(id), entries);
    } catch (e) {
        return false;
    }
}

const loadGridState = id => localStorage.get(localStorageKey(id));

export default {
    saveGridState,
    loadGridState,
};
