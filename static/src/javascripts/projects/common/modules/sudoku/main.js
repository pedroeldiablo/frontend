/* eslint-disable new-cap */
import bonzo from 'bonzo';
import React from 'react';
import $ from 'common/utils/$';
import flatMap from 'common/modules/sudoku/flatMap';
import Grid from 'common/modules/sudoku/grid';
import range from 'lodash/arrays/range';
import map from 'lodash/collections/map';
export default function() {
    $('.js-sudoku').each(function(element) {
        var $element = bonzo(element),
            sudokuData,
            cells;

        if ($element.attr('data-sudoku-data')) {
            sudokuData = JSON.parse($element.attr('data-sudoku-data'));
            cells = flatMap(range(9), function(y) {
                return map(range(9), function(x) {
                    return {
                        x: x,
                        y: y,
                        value: sudokuData[x][y],
                        jottings: [],
                        isEditable: sudokuData[x][y] === null,
                        isFocussed: false,
                        isHighlighted: false,
                        isSameValue: false,
                        isError: false
                    };
                });
            });

            React.render(Grid({
                cells: cells
            }), element);
        }
    });
};
