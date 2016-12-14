import bean from 'bean';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import throttle from 'lodash/functions/throttle';

const Search = function () {
    let searchLoader,
        gcsUrl,
        resultSetSize,
        container,
        self = this;

    if (config.switches.googleSearch && config.page.googleSearchUrl && config.page.googleSearchId) {
        gcsUrl = `${config.page.googleSearchUrl}?cx=${config.page.googleSearchId}`;
        resultSetSize = config.page.section === 'identity' ? 3 : 10;

        searchLoader = throttle(() => {
            self.load();
        });

        bean.on(document, 'click', '.js-search-toggle', (e) => {
            searchLoader();

            // Make sure search is always in the correct state
            self.checkResults();
            self.focusSearchField();
            e.preventDefault();
            mediator.emit('modules:search');
        });

        bean.on(document, 'keydown', '.gsc-input', () => {
            fastdom.read(() => {
                let $autoCompleteObject = $('.gssb_c'),
                    searchFromTop = $autoCompleteObject.css('top'),
                    windowOffset = $(window).scrollTop();

                fastdom.write(() => {
                    $autoCompleteObject.css({
                        top: parseInt(searchFromTop, 10) + windowOffset,
                        'z-index': '1030',
                    });
                });
            });
        });

        bean.on(document, 'click', '.search-results', (e) => {
            const targetEl = e.target;
            if (targetEl.nodeName.toLowerCase() === 'a') {
                targetEl.target = '_self';
            }
        });
    }

    this.focusSearchField = function () {
        const $input = $('input.gsc-input');
        if ($input.length > 0) {
            $input.focus();
        }
    };

    this.load = function () {
        let s,
            x;

        container = document.body.querySelector('.js-search-placeholder');

        // Set so Google know what to do
        window.__gcse = {
            callback: self.focusSearchField,
        };

        // Unload any search placeholders elsewhere in the DOM
        Array.prototype.forEach.call(document.querySelectorAll('.js-search-placeholder'), (c) => {
            if (c !== container) {
                fastdom.write(() => {
                    c.innerHTML = '';
                });
            }
        });

        // Load the Google search monolith, if not already present in this context.
        // We have to re-run their script each time we do this.
        if (!container.innerHTML) {
            fastdom.write(() => {
                container.innerHTML = `${'' +
                    '<div class="search-box" role="search">' +
                    '<gcse:searchbox></gcse:searchbox>' +
                    '</div>' +
                    '<div class="search-results" data-link-name="search">' +
                    '<gcse:searchresults webSearchResultSetSize="'}${resultSetSize}" linkTarget="_self"></gcse:searchresults>` +
                    '</div>';
            });

            s = document.createElement('script');
            s.async = true;
            s.src = gcsUrl;
            x = document.getElementsByTagName('script')[0];
            fastdom.write(() => {
                x.parentNode.insertBefore(s, x);
            });
        }
    };

    this.init = function () {};
};

export default Search;
