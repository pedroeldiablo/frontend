import bean from 'bean';
import $ from 'common/utils/$';
import fetchJson from 'common/utils/fetch-json';
import mediator from 'common/utils/mediator';
import reportError from 'common/utils/report-error';
import forEach from 'lodash/collections/forEach';
import initial from 'lodash/arrays/initial';
import chain from 'common/utils/chain';

function SearchTool(options) {
    let $list = null;
    let $input = null;
    let oldQuery = '';
    let newQuery = '';
    let inputTmp = '';

    const keyCodeMap = {
        13: 'enter',
        38: 'up',
        40: 'down',
    };

    const opts = options || {};
    const $container = opts.container;
    const apiUrl = opts.apiUrl;

    return {
        init() {
            this.bindElements($container);
            this.bindEvents();
        },

        bindElements(container) {
            $list = $('.js-search-tool-list', container);
            $input = $('.js-search-tool-input', container);
        },

        bindEvents() {
            bean.on(document.body, 'keyup', this.handleKeyEvents.bind(this));
            bean.on(document.body, 'click', this.handleClick.bind(this));

            mediator.on('autocomplete:toggle', this.toggleControls.bind(this));
        },

        hasInputValueChanged() {
            return (oldQuery.length !== newQuery.length);
        },

        handleClick(e) {
            const isInput = $(e.target).hasClass('js-search-tool-input');
            const isLink = this.isLink(e.target);

            if (isInput) {
                e.preventDefault();
                mediator.emit('autocomplete:toggle', true);
            } else if (isLink) {
                e.preventDefault();
                $('.active', $list).removeClass('active');
                $(isLink).addClass('active');
                this.pushData();
            } else {
                mediator.emit('autocomplete:toggle', false);
            }
        },

        isLink(target) {
            if ($(target).hasClass('js-search-tool-link')) {
                return target;
            } else {
                return $.ancestor(target, 'js-search-tool-link');
            }
        },

        toggleControls(value) {
            const $input = $('.js-search-tool-input')[0];
            const $location = $('.js-search-tool');
            const $close = $('.js-close-location');
            const $edit = $('.js-edit-location');

            if (value) {
                inputTmp = $input.value;
                $location.addClass('is-editing');
                $input.setSelectionRange(0, $input.value.length);
                $close.removeClass('u-h');
                $edit.addClass('u-h');
            } else {
                $location.removeClass('is-editing');
                this.clear();
                this.setInputValue(inputTmp);
                $close.addClass('u-h');
                $edit.removeClass('u-h');
            }
        },

        pushData() {
            const $active = $('.active', $list);
            let data = {};
            let store = 'set';

            if ($active.length === 0) {
                if ($input.val() === '') {
                    store = 'remove';
                } else {
                    return false;
                }
            }

            data = {
                id: $active.attr('data-weather-id'),
                city: $active.attr('data-weather-city'),
                store,
            };

            // Send data to whoever is listening
            mediator.emit('autocomplete:fetch', data);
            this.setInputValue();
            inputTmp = data.city;
            $input.blur();

            // Clear all after timeout because of the tracking we can't remove everything straight away
            setTimeout(this.destroy.bind(this), 50);

            return data;
        },

        getListOfResults(e) {
            newQuery = e.target.value;

            // If we have empty input clear everything and don't fetch the data
            if (!e.target.value.match(/\S/)) {
                this.clear();
                oldQuery = '';
                return;
            }

            // If input value hasn't changed don't fetch the data
            if (!this.hasInputValueChanged()) {
                return;
            }

            this.fetchData();
        },

        fetchData() {
            return fetchJson(apiUrl + newQuery, {
                mode: 'cors',
            }).then((positions) => {
                this.renderList(positions, 5);
                oldQuery = newQuery;
            })
                .catch((ex) => {
                    reportError(ex, {
                        feature: 'search-tool',
                    });
                });
        },

        handleKeyEvents(e) {
            const key = keyCodeMap[e.which || e.keyCode];

            // Run this function only if we are inside the input
            if (!$(e.target).hasClass('js-search-tool-input')) {
                return;
            }

            if (key === 'down') { // down
                e.preventDefault();
                this.move(1);
            } else if (key === 'up') { // up
                e.preventDefault();
                this.move(-1);
            } else if (key === 'enter') { // enter
                this.pushData();
            } else {
                this.getListOfResults(e);
            }
        },

        move(increment) {
            const $active = $('.active', $list);
            let id = parseInt($active.attr('id'), 10);

            if (isNaN(id)) {
                id = -1;
            }

            $active.removeClass('active');

            // When outside of the list show latest query
            if (this.getNewId(id + increment) < 0) {
                this.setInputValue(oldQuery);

                // When looping inside of the list show list item
            } else {
                $(`#${this.getNewId(id + increment)}sti`, $list).addClass('active');
                this.setInputValue();
            }
        },

        getNewId(id) {
            const len = $('li', $list).length;
            let newId = id % len;

            // Make sure that we can hit saved input option which has position -1
            if (newId < -1) {
                newId = len - 1;
            } else if (id === len) {
                newId = -1;
            }

            return newId;
        },

        setInputValue(value) {
            const inputValue = value || $('.active', $list).attr('data-weather-city');

            $input.val(inputValue);
        },

        renderList(results, numOfResults) {
            const docFragment = document.createDocumentFragment();
            const resultsToShow = results.length - numOfResults;

            chain(results).and(initial, resultsToShow).and(forEach, (item, index) => {
                const li = document.createElement('li');

                li.className = 'search-tool__item';
                li.innerHTML = `<a role="button" href="#${item.id}"` +
                    ` id="${index}sti" class="js-search-tool-link search-tool__link${index === 0 ? ' active"' : '"'
                    } data-link-name="weather-search-tool" data-weather-id="${item.id}" data-weather-city="${item.city}">${
                    item.city} <span class="search-tool__meta">${item.country}</span></a>`;

                docFragment.appendChild(li);
            });

            this.clear().append(docFragment);
        },

        clear() {
            return $list.html('');
        },

        destroy() {
            this.clear();
        },
    };
}

export default SearchTool;
