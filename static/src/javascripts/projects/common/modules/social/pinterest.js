import fastdom from 'fastdom';
import bean from 'bean';
import $ from 'common/utils/$';
var buttonsSelector = '.social__item--pinterest',
    buttons;

function launchOverlay(event) {
    event.preventDefault();

    $('img:not(.gu-image):not(.responsive-img):not(.gallery2__img)').each(function(img) {
        fastdom.write(function() {
            $(img).attr('data-pin-nopin', 'true');
        });
    });

    require(['js!https://assets.pinterest.com/js/pinmarklet.js?r=' + new Date().getTime()]);
}

export default function() {
    buttons = buttons || $(buttonsSelector);
    buttons.each(function(el) {
        bean.on(el, 'click', launchOverlay);
    });
};
