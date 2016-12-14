import $ from 'common/utils/$';
import userPrefs from 'common/modules/user-prefs';
import forEach from 'lodash/collections/forEach';
/* We live in a rainbow of chaos. */
// ^ U WOT

function set(mode) {
    const val = `${mode}(100%)`;
    $('body').css({
        '-webkit-filter': val,
        filter: val,
    });
}

function breuer() {
    $('body').addClass('is-breuer-mode');
}

export default function () {
    forEach(['sepia', 'grayscale', 'invert', 'contrast', 'saturate', 'opacity'], (filter) => {
        if (userPrefs.isOn(filter)) {
            set(filter);
        }

        if (userPrefs.isOn('breuerMode')) {
            breuer();
        }
    });
}
