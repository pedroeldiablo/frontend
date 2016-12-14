/*eslint-disable new-cap*/
import React from 'react';
import Cell from 'common/modules/sudoku/cell';
import Controls from 'common/modules/sudoku/controls';
import constants from 'common/modules/sudoku/constants';
import flatMap from 'common/modules/sudoku/flatMap';
import utils from 'common/modules/sudoku/utils';
import map from 'lodash/collections/map';
import range from 'lodash/arrays/range';
import forEach from 'lodash/collections/forEach';
import assign from 'lodash/objects/assign';
import bind from 'lodash/functions/bind';
import constant from 'lodash/utilities/constant';
import contains from 'lodash/collections/contains';
import without from 'lodash/arrays/without';
export default React.createClass({
    getInitialState: function() {
        return {
            cells: this.props.cells
        };
    },

    onBlur: function() {
        this.state.focus = null;
        this.updateCellStatesAndRender();
    },

    onKeyDown: function(event) {
        var x, y, n;

        if (this.state.focus) {
            x = this.state.focus.x;
            y = this.state.focus.y;

            if (event.keyCode === constants.keyLeft && x > 0) {
                event.preventDefault();
                this.focusCell(x - 1, y);
            } else if (event.keyCode === constants.keyRight && x < 8) {
                event.preventDefault();
                this.focusCell(x + 1, y);
            } else if (event.keyCode === constants.keyUp && y > 0) {
                event.preventDefault();
                this.focusCell(x, y - 1);
            } else if (event.keyCode === constants.keyDown && y < 8) {
                event.preventDefault();
                this.focusCell(x, y + 1);
            } else if (event.keyCode === constants.keyBackspace) {
                event.preventDefault();
                this.unsetFocussedValue();
            } else {
                n = utils.numberFromKeyCode(event.keyCode);

                if (n !== null && n > 0) {
                    event.preventDefault();

                    if (event.ctrlKey) {
                        this.addJotting(n);
                    } else {
                        this.setFocussedValue(n);
                    }
                }
            }
        }
    },

    getFocussedCell: function() {
        var focus = this.state.focus;

        if (focus) {
            return this.getCell(focus.x, focus.y);
        } else {
            return null;
        }
    },

    getCell: function(x, y) {
        return this.state.cells[y * 9 + x];
    },

    setFocussedValue: function(n) {
        var focussed = this.getFocussedCell();

        if (focussed && focussed.isEditable) {
            focussed.value = n;
            focussed.jottings = [];

            this.updateCellStatesAndRender();
        }
    },

    unsetFocussedValue: function() {
        var focussed = this.getFocussedCell();

        if (focussed.isEditable && focussed.value !== null) {
            focussed.value = null;
            this.updateCellStatesAndRender();
        }
    },

    addJotting: function(n) {
        var focussed = this.getFocussedCell();

        if (focussed.isEditable) {
            focussed.value = null;

            if (contains(focussed.jottings, n)) {
                focussed.jottings = without(focussed.jottings, n);
            } else {
                focussed.jottings.push(n);
            }

            this.updateCellStatesAndRender();
        }
    },

    updateCellStatesAndRender: function() {
        var focus = this.state.focus,
            isHighlighted = focus ? utils.highlights(focus.x, focus.y) : constant(false),
            focussedCell = this.getFocussedCell(),
            valueInFocus = focussedCell ? focussedCell.value : null;

        this.mapCells(function(cell) {
            return assign({}, cell, {
                isHighlighted: isHighlighted(cell.x, cell.y),
                isSameValue: cell.value && cell.value === valueInFocus,
                isFocussed: focus && cell.x === focus.x && cell.y === focus.y
            });
        });

        this.highlightErrors();
        this.forceUpdate();
    },

    highlightErrors: function() {
        var self = this,
            rows, columns, squares;

        this.mapCells(function(cell) {
            return assign({}, cell, {
                isError: false
            });
        });

        rows = map(range(9), function(y) {
            return map(range(9), function(x) {
                return self.getCell(x, y);
            });
        });

        columns = map(range(9), function(x) {
            return map(range(9), function(y) {
                return self.getCell(x, y);
            });
        });

        squares = flatMap(range(3), function(x) {
            return map(range(3), function(y) {
                return flatMap(range(3), function(dx) {
                    return map(range(3), function(dy) {
                        return self.getCell(x * 3 + dx, y * 3 + dy);
                    });
                });
            });
        });

        forEach(rows.concat(columns, squares), bind(this.highlightDuplicatesInRange, this));
    },

    highlightDuplicatesInRange: function(cells) {
        var cellsByValue = map(range(9), function() {
            return [];
        });

        forEach(cells, function(cell) {
            if (cell.value) {
                cellsByValue[cell.value - 1].push(cell);
            }
        });

        forEach(cellsByValue, function(cells) {
            if (cells.length > 1) {
                forEach(cells, function(cell) {
                    cell.isError = true;
                });
            }
        });
    },

    focusCell: function(x, y) {
        this.state.focus = {
            x: x,
            y: y
        };

        this.updateCellStatesAndRender();
    },

    mapCells: function(f) {
        this.state.cells = map(this.state.cells, f);
        this.forceUpdate();
    },

    render: function() {
        var self = this,
            cells = map(this.state.cells, function(cell) {
                var data = assign({}, cell, {
                    key: cell.x + '_' + cell.y,
                    onClick: self.focusCell
                });

                return Cell(data);
            }),
            gridSize = utils.position(9);

        return React.DOM.svg({
            width: gridSize,
            height: gridSize + constants.controlsTopMargin + constants.controlsHeight,
            tabIndex: '0',
            onKeyDown: this.onKeyDown,
            className: 'sudoku__grid',
            viewBox: '0 0 ' + gridSize + ' ' + (gridSize + constants.controlsTopMargin + constants.controlsHeight),
            onBlur: this.onBlur
        }, React.DOM.rect({
            className: 'sudoku__background',
            x: 0,
            y: 0,
            width: gridSize,
            height: gridSize
        }), Controls({
            x: constants.controlsLeftMargin,
            y: gridSize + constants.controlsTopMargin,
            onClickNumber: this.setFocussedValue,
            onClickDelete: this.unsetFocussedValue
        }), cells);
    }
});
