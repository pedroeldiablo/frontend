import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import mediator from 'common/utils/mediator';
import userPrefs from 'common/modules/user-prefs';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import btnTmpl from 'text!facia/views/button-toggle.html';
export default function (container) {
    let _$container = bonzo(container),
        _$button = bonzo(bonzo.create(
            template(btnTmpl, {
                text: 'Hide',
                dataLink: 'Show',
                icon: svgs('arrowicon'),
            })
        )),
        buttonText = $('.fc-container__toggle__text', _$button[0]),
        _prefName = 'container-states',
        _toggleText = {
            hidden: 'Show',
            displayed: 'Hide',
        },
        _state = 'displayed',
        _updatePref = function (id, state) {
            // update user prefs
            let prefs = userPrefs.get(_prefName),
                prefValue = id;
            if (state === 'displayed') {
                delete prefs[prefValue];
            } else {
                if (!prefs) {
                    prefs = {};
                }
                prefs[prefValue] = 'closed';
            }
            userPrefs.set(_prefName, prefs);
        },
        _readPrefs = function (id) {
            // update user prefs
            const prefs = userPrefs.get(_prefName);
            if (prefs && prefs[id]) {
                setState('hidden');
            }
        };

    // delete old key
    userPrefs.remove('front-trailblocks');

    function setState(state) {
        _state = state;

        fastdom.write(() => {
            // add/remove rolled class
            _$container[_state === 'displayed' ? 'removeClass' : 'addClass']('fc-container--rolled-up');
            // data-link-name is inverted, as happens before clickstream
            _$button.attr('data-link-name', _toggleText[_state === 'displayed' ? 'hidden' : 'displayed']);
            buttonText.text(_toggleText[_state]);
        });
    }

    this.addToggle = function () {
        // append toggle button
        let id = _$container.attr('data-id'),
            $containerHeader = $('.js-container__header', _$container[0]);

        fastdom.write(() => {
            $containerHeader.append(_$button);
            _$container
                .removeClass('js-container--toggle')
                .addClass('fc-container--has-toggle');
            _readPrefs(id);
        });

        mediator.on('module:clickstream:click', (clickSpec) => {
            if (clickSpec.target === _$button[0]) {
                setState((_state === 'displayed') ? 'hidden' : 'displayed');
                _updatePref(id, _state);
            }
        });
    };
}
