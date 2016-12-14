/* eslint-disable new-cap */
import React from 'react';
import constants from 'common/modules/sudoku/constants';
import map from 'lodash/collections/map';
import range from 'lodash/arrays/range';
const Button = React.createClass({
    render() {
        return React.DOM.g({
            className: 'sudoku__button',
            onClick: this.props.onClick,
        },
            React.DOM.rect({
                className: 'sudoku__button-background',
                x: this.props.x,
                y: this.props.y,
                rx: constants.buttonBorderRadius,
                ry: constants.buttonBorderRadius,
                width: constants.buttonSize,
                height: constants.buttonSize,
            }), React.DOM.text({
                className: 'sudoku__button-text',
                x: this.props.x + constants.buttonSize / 2,
                y: this.props.y + constants.buttonTopMargin,
            }, this.props.text)
        );
    },
});

export default React.createClass({
    render() {
        let self = this;
        let x = this.props.x;
        let y = this.props.y;
        let buttonsPerRow = 7;
        let buttonOffset = n => n * (constants.buttonSize + constants.buttonMargin);

        let numberButtons = map(range(9), (n) => {
            let col = n % buttonsPerRow;
            let row = Math.floor(n / buttonsPerRow);
            let buttonX = x + buttonOffset(col);
            let buttonY = y + buttonOffset(row);

            return Button({
                key: `button_${n}`,
                x: buttonX,
                y: buttonY,
                text: `${n + 1}`,
                onClick() {
                    self.props.onClickNumber(n + 1);
                },
            });
        });

        return React.DOM.g({
            className: 'sudoku__controls',
        },
            Button({
                key: 'button_erase',
                x: x + buttonOffset(2),
                y: y + buttonOffset(1),
                text: '-',
                onClick() {
                    self.props.onClickDelete();
                },
            }),
            numberButtons
        );
    },
});
