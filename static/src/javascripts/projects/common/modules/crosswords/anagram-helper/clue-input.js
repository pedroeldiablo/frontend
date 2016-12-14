import React from 'react';
const ClueInput = React.createClass({

    componentDidMount() {
        React.findDOMNode(this).focus();
    },

    componentDidUpdate() {
        // focus on reset
        if (this.props.value === '') {
            React.findDOMNode(this).focus();
        }
    },

    onInputChange(e) {
        this.props.onChange(e.target.value.toLowerCase());
    },

    onKeyDown(e) {
        if (e.keyCode === 13) {
            React.findDOMNode(this).blur();
            this.props.onEnter();
        }
    },

    render() {
        return React.createElement('input', {
            type: 'text',
            className: 'crossword__anagram-helper__clue-input',
            placeholder: 'Enter letters',
            maxLength: this.props.clue.length,
            value: this.props.value,
            onChange: this.onInputChange,
            onKeyDown: this.onKeyDown,
        });
    },
});

export default ClueInput;
