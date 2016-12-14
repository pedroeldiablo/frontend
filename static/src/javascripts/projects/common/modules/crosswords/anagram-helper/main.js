import React from 'react';
import svgs from 'common/views/svgs';
import ClueInput from './clue-input';
import CluePreview from './clue-preview';
import Ring from './ring';
import helpers from '../helpers';
import contains from 'lodash/collections/contains';
import shuffle from 'lodash/collections/shuffle';
import reduce from 'lodash/collections/reduce';
import rest from 'lodash/arrays/rest';
import map from 'lodash/collections/map';
import compact from 'lodash/arrays/compact';
import filter from 'lodash/collections/filter';
import chain from 'common/utils/chain';
const AnagramHelper = React.createClass({
    getInitialState() {
        return {
            clueInput: '',
            showInput: true,
        };
    },

    componentWillReceiveProps(next) {
        // reset on clue change
        if (next.clue !== this.props.focussedEntry) {
            this.reset();
        }
    },

    onClueInput(text) {
        if (!/\s|\d/g.test(text)) {
            this.setState({
                clueInput: text,
            });
        }
    },

    /**
     * Shuffle the letters in the user's input.
     *
     * First, create an array of input characters that have already been entered
     * into the grid. Then build a new collection of letters, using the first
     * array to flag letters that are already entered in the puzzle, and
     * shuffle it.
     *
     * @param  {String}   word     word to shuffle
     * @param  {[Object]} entries  array of entries (i.e. grid cells)
     * @return {[Object]}          array of shuffled letters
     */
    shuffleWord(word, entries) {
        const wordEntries = chain(entries).and(map, entry => entry.value.toLowerCase()).and(filter, entry => contains(word, entry)).and(compact).value().sort();

        return shuffle(reduce(word.trim().split('').sort(), (acc, letter) => {
            const entered = acc.entries[0] === letter.toLowerCase();

            return {
                letters: acc.letters.concat({
                    value: letter,
                    entered,
                }),
                entries: entered ? rest(acc.entries) : acc.entries,
            };
        }, {
            letters: [],
            entries: wordEntries,
        }).letters);
    },

    shuffle() {
        if (this.canShuffle()) {
            this.setState({
                showInput: false,
            });
        }
    },

    reset() {
        if (this.state.clueInput) {
            this.setState({
                clueInput: '',
                showInput: true,
            });
        }
    },

    canShuffle() {
        return this.state.clueInput &&
            this.state.clueInput.length > 0;
    },

    render() {
        const closeIcon = {
            __html: svgs('closeCentralIcon'),
        };
        const clue = helpers.getAnagramClueData(this.props.entries, this.props.focussedEntry);
        const cells = helpers.cellsForClue(this.props.entries, this.props.focussedEntry);
        const entries = map(cells, function (coords) {
            return this.props.grid[coords.x][coords.y];
        }, this);
        const letters = this.shuffleWord(this.state.clueInput, entries);

        const inner = this.state.showInput ?
            React.createElement(ClueInput, {
                value: this.state.clueInput,
                clue,
                onChange: this.onClueInput,
                onEnter: this.shuffle,
            }) :
            React.createElement(Ring, {
                letters,
            });

        return React.createElement('div', {
            className: 'crossword__anagram-helper-outer',
            'data-link-name': 'Anagram Helper',
        },
            React.createElement('div', {
                className: 'crossword__anagram-helper-inner',
            }, inner),
            React.createElement('button', {
                className: 'button button--large button--tertiary crossword__anagram-helper-close',
                onClick: this.props.close,
                dangerouslySetInnerHTML: closeIcon,
                'data-link-name': 'Close',
            }),
            React.createElement('button', {
                className: `button button--large ${!this.state.clueInput && 'button--tertiary'}`,
                onClick: this.reset,
                'data-link-name': 'Start Again',
            }, 'start again'),
            React.createElement('button', {
                className: `button button--large ${!this.canShuffle() && 'button--tertiary'}`,
                onClick: this.shuffle,
                'data-link-name': 'Shuffle',
            }, 'shuffle'),
            React.createElement(CluePreview, {
                clue,
                entries,
                letters,
                hasShuffled: !this.state.showInput,
            })
        );
    },
});

export default AnagramHelper;
