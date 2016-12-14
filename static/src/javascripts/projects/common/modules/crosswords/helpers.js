import constants from './constants';
import findIndex from 'lodash/arrays/findIndex';
import find from 'lodash/collections/find';
import map from 'lodash/collections/map';
import forEach from 'lodash/collections/forEach';
import flatten from 'lodash/arrays/flatten';
import first from 'lodash/arrays/first';
import reduce from 'lodash/collections/reduce';
import contains from 'lodash/collections/contains';
import every from 'lodash/collections/every';
import range from 'lodash/arrays/range';
import uniq from 'lodash/arrays/uniq';
import filter from 'lodash/collections/filter';
import some from 'lodash/collections/some';
import chain from 'common/utils/chain';
const isAcross = function (clue) {
    return clue.direction === 'across';
};
const getLastCellInClue = function (clue) {
    const ax = {
        true: 'x',
        false: 'y',
    };
    const axis = ax[isAcross(clue)];
    const otherAxis = ax[!isAcross(clue)];

    const cell = {};
    cell[axis] = clue.position[axis] + (clue.length - 1);
    cell[otherAxis] = clue.position[otherAxis];

    return cell;
};

const isFirstCellInClue = function (cell, clue) {
    const axis = isAcross(clue) ? 'x' : 'y';
    return cell[axis] === clue.position[axis];
};

const isLastCellInClue = function (cell, clue) {
    const axis = isAcross(clue) ? 'x' : 'y';
    return cell[axis] === clue.position[axis] + (clue.length - 1);
};

const getNextClueInGroup = function (entries, clue) {
    const newClueId = clue.group[findIndex(clue.group, id => id === clue.id) + 1];
    return find(entries, {
        id: newClueId,
    });
};

const getPreviousClueInGroup = function (entries, clue) {
    const newClueId = clue.group[findIndex(clue.group, id => id === clue.id) - 1];
    return find(entries, {
        id: newClueId,
    });
};

const getGroupEntriesForClue = function (entries, group) {
    return map(group, clueId => find(entries, {
        id: clueId,
    }));
};

const clueIsInGroup = function clueIsInGroup(clue) {
    return clue.group.length !== 1;
};

const getAllSeparatorsForGroup = function (clues) {
    const k = {};

    forEach([',', '-'], (separator) => {
        let cnt = 0;
        const flattenedSeparators = flatten(map(clues, (clue) => {
            const seps = map(clue.separatorLocations[separator], s => s + cnt);
            cnt += clue.length;
            return seps;
        }));
        k[separator] = flattenedSeparators;
    });
    return k;
};

const getClueForGroupedEntries = function (clueGroup) {
    return first(clueGroup).clue;
};

const getNumbersForGroupedEntries = function (clueGroup) {
    return first(clueGroup).humanNumber;
};

const getTtotalLengthOfGroup = function (clueGroup) {
    const length = reduce(clueGroup, (total, clue) => {
        const t = total += clue.length;
        return t;
    }, 0);
    return length;
};

const getAnagramClueData = function (entries, clue) {
    if (clueIsInGroup(clue)) {
        const groupEnts = getGroupEntriesForClue(entries, clue.group);
        return {
            id: clue.id,
            number: getNumbersForGroupedEntries(groupEnts),
            length: getTtotalLengthOfGroup(groupEnts),
            separatorLocations: getAllSeparatorsForGroup(groupEnts),
            direction: '',
            clue: getClueForGroupedEntries(groupEnts),
        };
    }
    return clue;
};

const cluesAreInGroup = function (clue, otherClue) {
    return contains(otherClue.group, clue.id);
};

const cellsForEntry = function (entry) {
    return isAcross(entry) ? map(range(entry.position.x, entry.position.x + entry.length), x => ({
        x,
        y: entry.position.y,
    })) : map(range(entry.position.y, entry.position.y + entry.length), y => ({
        x: entry.position.x,
        y,
    }));
};

const checkClueHasBeenAnswered = function (grid, entry) {
    return every(cellsForEntry(entry), position => (/^[A-Z]$/.test(grid[position.x][position.y].value)));
};

const otherDirection = function (direction) {
    return direction === 'across' ? 'down' : 'across';
};

const cellsForClue = function (entries, clue) {
    if (clueIsInGroup(clue)) {
        const entriesForClue = getGroupEntriesForClue(entries, clue.group);
        return flatten(map(entriesForClue, entry => cellsForEntry(entry)));
    } else {
        return cellsForEntry(clue);
    }
};

/** Hash key for the cell at x, y in the clue map */
const clueMapKey = function (x, y) {
    return `${x}_${y}`;
};

const cluesFor = function (clueMap, x, y) {
    return clueMap[clueMapKey(x, y)];
};

const getClearableCellsForEntry = function (grid, clueMap, entries, entry) {
    const direction = entry.direction === 'across' ? 'down' : 'across';
    return filter(cellsForEntry(entry), (cell) => {
        const clues = cluesFor(clueMap, cell.x, cell.y);
        const otherClue = clues[direction];
        if (otherClue) {
            return cluesAreInGroup(entry, otherClue) || !checkClueHasBeenAnswered(grid, otherClue);
        }
        return true;
    });
};

const getClearableCellsForClue = function (grid, clueMap, entries, clue) {
    if (clueIsInGroup(clue)) {
        const entriesForClue = getGroupEntriesForClue(entries, clue.group);
        return uniq(flatten(map(entriesForClue, entry => getClearableCellsForEntry(grid, clueMap, entries, entry))), cell => [cell.x, cell.y].join());
    } else {
        return getClearableCellsForEntry(grid, clueMap, entries, clue);
    }
};

/**
 * Builds the initial state of the grid given the number of rows, columns, and a list of clues.
 */
const buildGrid = function (rows, columns, entries, savedState) {
    const grid = map(range(columns), x => map(range(rows), y => ({
        isHighlighted: false,
        isEditable: false,
        isError: false,
        isAnimating: false,
        value: savedState && savedState[x] && savedState[x][y] ? savedState[x][y] : '',
    })));

    forEach(entries, (entry) => {
        const x = entry.position.x;
        const y = entry.position.y;

        grid[x][y].number = entry.number;

        forEach(cellsForEntry(entry), (cell) => {
            grid[cell.x][cell.y].isEditable = true;
        });
    });

    return grid;
};

/** A map for looking up clues that a given cell relates to */
const buildClueMap = function (clues) {
    const map = {};

    forEach(clues, (clue) => {
        forEach(cellsForEntry(clue), (cell) => {
            const key = clueMapKey(cell.x, cell.y);

            if (map[key] === undefined) {
                map[key] = {};
            }

            if (isAcross(clue)) {
                map[key].across = clue;
            } else {
                map[key].down = clue;
            }
        });
    });

    return map;
};

/** A map for looking up separators (i.e word or hyphen) that a given cell relates to */
const buildSeparatorMap = function (clues) {
    return chain(clues).and(map, clue => map(clue.separatorLocations, (locations, separator) => locations.map((location) => {
        const key = isAcross(clue) ? clueMapKey(clue.position.x + location, clue.position.y) : clueMapKey(clue.position.x, clue.position.y + location);

        return {
            key,
            direction: clue.direction,
            separator,
        };
    }))).and(flatten).and(reduce, (map, d) => {
        if (map[d.key] === undefined) {
            map[d.key] = {};
        }

        map[d.key][d.direction] = d.separator;

        return map;
    }, {}).value();
};

const entryHasCell = function (entry, x, y) {
    return some(cellsForEntry(entry), cell => cell.x === x && cell.y === y);
};

/** Can be used for width or height, as the cell height == cell width */
const gridSize = function (cells) {
    return cells * (constants.cellSize + constants.borderSize) + constants.borderSize;
};

const mapGrid = function (grid, f) {
    return map(grid, (col, x) => map(col, (cell, y) => f(cell, x, y)));
};

export default {
    isAcross,
    otherDirection,
    buildGrid,
    clueMapKey,
    cluesFor,
    buildClueMap,
    buildSeparatorMap,
    cellsForEntry,
    cellsForClue,
    entryHasCell,
    gridSize,
    mapGrid,
    getAnagramClueData,
    getLastCellInClue,
    isFirstCellInClue,
    isLastCellInClue,
    getNextClueInGroup,
    getPreviousClueInGroup,
    clueIsInGroup,
    getGroupEntriesForClue,
    getNumbersForGroupedEntries,
    getClueForGroupedEntries,
    getAllSeparatorsForGroup,
    getTtotalLengthOfGroup,
    cluesAreInGroup,
    checkClueHasBeenAnswered,
    getClearableCellsForClue,
};
