import qwery from 'qwery';
import fastdom from 'fastdom';
import ophan from 'ophan/ng';
import editionPicker from 'common/modules/navigation/edition-picker';
import userAccount from 'common/modules/navigation/user-account';
const html = qwery('html')[0];
const menuItems = qwery('.js-close-nav-list');
const buttonClickHandlers = {
    'main-menu-toggle': veggieBurgerClickHandler,
    'edition-picker': editionPicker,
};
const enhanced = {};

function weShouldEnhance(checkbox) {
    return !enhanced[checkbox.id] && checkbox && !checkbox.checked;
}


function applyEnhancementsTo(checkbox) {
    fastdom.read(() => {
        const button = document.createElement('button');
        const checkboxId = checkbox.id;
        const checkboxControls = checkbox.getAttribute('aria-controls');
        const checkboxClasses = Array.prototype.slice.call(checkbox.classList);

        checkboxClasses.forEach((c) => {
            button.classList.add(c);
        });
        button.setAttribute('id', checkboxId);
        button.setAttribute('aria-controls', checkboxControls);
        button.setAttribute('aria-expanded', 'false');

        fastdom.write(() => {
            const eventHandler = buttonClickHandlers[button.id];

            checkbox.parentNode.replaceChild(button, checkbox);
            if (eventHandler) {
                button.addEventListener('click', eventHandler);
            }
            enhanced[button.id] = true;
        });
    });
}

function closeAllOtherPrimaryLists(targetItem) {
    menuItems.forEach((item) => {
        if (item !== targetItem) {
            item.removeAttribute('open');
        }
    });
}

function removeOrderingFromLists() {
    const mainListItems = qwery('.js-navigation-item');

    mainListItems.forEach((item) => {
        item.style.order = '';
    });
}

function enhanceCheckboxesToButtons() {
    const checkboxIds = ['main-menu-toggle', 'edition-picker'];

    checkboxIds.forEach((checkboxId) => {
        const checkbox = document.getElementById(checkboxId);

        if (!checkbox) {
            return;
        }
        if (weShouldEnhance(checkbox)) {
            applyEnhancementsTo(checkbox);
        } else {
            checkbox.addEventListener('click', function closeMenuHandler() {
                applyEnhancementsTo(checkbox);
                checkbox.removeEventListener('click', closeMenuHandler);
            });
            if (checkboxId === 'main-menu-toggle') {
                // record in Ophan that the menu was opened in a fully expanded state
                // i.e. standard JS had not been loaded when menu was first opened
                ophan.record({
                    component: 'main-navigation',
                    value: 'is fully expanded',
                });
            }
        }
    });
}

function veggieBurgerClickHandler(event) {
    const button = event.target;
    const mainMenu = document.getElementById('main-menu');
    const veggieBurgerLink = qwery('.js-change-link')[0];

    function menuIsOpen() {
        return button.getAttribute('aria-expanded') === 'true';
    }

    if (!mainMenu || !veggieBurgerLink) {
        return;
    }
    if (menuIsOpen()) {
        fastdom.write(() => {
            button.setAttribute('aria-expanded', 'false');
            mainMenu.setAttribute('aria-hidden', 'true');
            veggieBurgerLink.classList.remove('new-header__nav__menu-button--open');
            veggieBurgerLink.setAttribute('data-link-name', 'nav2 : veggie-burger : show');
            removeOrderingFromLists();

            // Users should be able to scroll again
            html.classList.remove('nav-is-open');
        });
    } else {
        fastdom.write(() => {
            const firstButton = qwery('.js-navigation-button')[0];

            button.setAttribute('aria-expanded', 'true');
            mainMenu.setAttribute('aria-hidden', 'false');
            veggieBurgerLink.classList.add('new-header__nav__menu-button--open');
            veggieBurgerLink.setAttribute('data-link-name', 'nav2 : veggie-burger : hide');

            if (firstButton) {
                firstButton.focus();
            }
            // No targetItem to put in as the parameter. All lists should close.
            closeAllOtherPrimaryLists();
            // Prevents scrolling on the body
            html.classList.add('nav-is-open');
        });
    }
}

function bindMenuItemClickEvents() {
    menuItems.forEach((item) => {
        item.addEventListener('click', closeAllOtherPrimaryLists.bind(null, item));
    });
}

function init() {
    enhanceCheckboxesToButtons();
    bindMenuItemClickEvents();
    userAccount();
}

export default init;
