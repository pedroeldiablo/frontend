import Promise from 'Promise';
import qwery from 'qwery';
import bean from 'bean';
import fastdom from 'fastdom';

export default {
    init,
};

function init() {
    const showMores = qwery('.adverts__more > summary');
    bean.on(document, 'click', showMores, onOpenClick);
    bean.on(document, 'click', showMores, onKeyPress(onOpenClick));

    return Promise.resolve();
}

function onKeyPress(handler) {
    return function (event) {
        if (event.keyCode === 0x20 || event.keyCode === 0x0D) {
            handler(event);
        }
    };
}

function onOpenClick(event) {
    const summary = event.currentTarget;
    const details = summary.parentNode;
    const label = summary.querySelector('.js-button__label');
    if (details.hasAttribute('open')) {
        fastdom.write(() => {
            label.textContent = `More ${summary.getAttribute('data-text')}`;
        });
    } else {
        fastdom.write(() => {
            label.textContent = 'Less';
        });
    }
}
