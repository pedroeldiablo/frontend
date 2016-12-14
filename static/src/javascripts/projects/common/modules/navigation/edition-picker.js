import fastdom from 'fastdom';
import qwery from 'qwery';

function editionPickerClickHandler(event) {
    event.stopPropagation();
    const button = event.target;
    const editionPickerDropdown = qwery('.js-edition-picker-dropdown')[0];

    function menuIsOpen() {
        return button.getAttribute('aria-expanded') === 'true';
    }

    function closeEditionPickerAndRemoveListener() {
        closeMenu();
        document.removeEventListener('click', closeEditionPickerAndRemoveListener, false);
    }

    function closeMenu() {
        fastdom.write(() => {
            button.setAttribute('aria-expanded', 'false');
            if (editionPickerDropdown) {
                editionPickerDropdown.setAttribute('aria-hidden', 'true');
            }
        });
    }

    if (menuIsOpen()) {
        closeEditionPickerAndRemoveListener();
    } else {
        fastdom.write(() => {
            button.setAttribute('aria-expanded', 'true');
            if (editionPickerDropdown) {
                editionPickerDropdown.setAttribute('aria-hidden', 'false');
            }
            document.addEventListener('click', closeEditionPickerAndRemoveListener, false);
        });
    }
}

export default editionPickerClickHandler;
