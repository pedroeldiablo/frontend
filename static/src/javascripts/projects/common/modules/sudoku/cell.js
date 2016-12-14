import React from 'react';
import constants from 'common/modules/sudoku/constants';
import utils from 'common/modules/sudoku/utils';
import compact from 'lodash/arrays/compact';
import map from 'lodash/collections/map';
export default React.createClass({
    onClick(event) {
        this.props.onClick(this.props.x, this.props.y);
        event.preventDefault();
    },

    render() {
        let self = this;
        let value = this.props.value;
        let x = utils.position(this.props.x);
        let y = utils.position(this.props.y);
        let jottingX = n => x + constants.jottingXOffset + ((n - 1) % 3) * constants.jottingWidth;
        let jottingY = n => y + constants.jottingYOffset + Math.floor((n - 1) / 3) * constants.jottingHeight;

        let innerCells = compact([
            React.DOM.rect({
                key: 'background',
                x,
                y,
                width: constants.cellSize,
                height: constants.cellSize,
                onClick: this.onClick,
            }),
            value ? React.DOM.text({
                key: 'value',
                x: x + constants.textXOffset,
                y: y + constants.textYOffset,
                className: 'sudoku__cell-text',
                onClick: this.onClick,
            }, value) : null,
        ]).concat(map(this.props.jottings, n => React.DOM.text({
            key: `jotting_${n}`,
            x: jottingX(n),
            y: jottingY(n),
            className: 'sudoku__cell-jotting',
            onClick: self.onClick,
        }, n)));

        return React.DOM.g({
            className: React.addons.classSet({
                sudoku__cell: true,
                'sudoku__cell--not-editable': !this.props.isEditable,
                'sudoku__cell--highlighted': this.props.isHighlighted,
                'sudoku__cell--focussed': this.props.isFocussed,
                'sudoku__cell--same-value': this.props.isSameValue,
                'sudoku__cell--error': this.props.isError,
            }),
        }, innerCells);
    },
});
