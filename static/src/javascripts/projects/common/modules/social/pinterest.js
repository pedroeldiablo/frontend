import fastdom from 'fastdom';
import bean from 'bean';
import $ from 'common/utils/$';
let buttonsSelector = '.social__item--pinterest';
let buttons;

function launchOverlay(event) {
    event.preventDefault();

    $('img:not(.gu-image):not(.responsive-img):not(.gallery2__img)').each((img) => {
        fastdom.write(() => {
            $(img).attr('data-pin-nopin', 'true');
        });
    });

    require([`js!https://assets.pinterest.com/js/pinmarklet.js?r=${new Date().getTime()}`]);
}

export default function () {
    buttons = buttons || $(buttonsSelector);
    buttons.each((el) => {
        bean.on(el, 'click', launchOverlay);
    });
}
