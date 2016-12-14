/* eslint-disable new-cap */
import bonzo from 'bonzo';
import React from 'react';
import $ from 'common/utils/$';
import flatMap from 'common/modules/sudoku/flatMap';
import Grid from 'common/modules/sudoku/grid';
import range from 'lodash/arrays/range';
import map from 'lodash/collections/map';
export default function () {
    $('.js-sudoku').each((element) => {
        const $element = bonzo(element);
        let sudokuData;
        let cells;

        if ($element.attr('data-sudoku-data')) {
            sudokuData = JSON.parse($element.attr('data-sudoku-data'));
            cells = flatMap(range(9), y => map(range(9), x => ({
                x,
                y,
                value: sudokuData[x][y],
                jottings: [],
                isEditable: sudokuData[x][y] === null,
                isFocussed: false,
                isHighlighted: false,
                isSameValue: false,
                isError: false,
            })));

            React.render(Grid({
                cells,
            }), element);
        }
    });
}
