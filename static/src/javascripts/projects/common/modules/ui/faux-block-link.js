import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
let overlaySelector = '.u-faux-block-link__overlay',
    hoverStateClassName = 'u-faux-block-link--hover';

export default function () {
    const showIntentToClick = function (e) {
        fastdom.write(() => {
            $(e.currentTarget).parent().addClass(hoverStateClassName);
        });
    };
    const removeIntentToClick = function (e) {
        fastdom.write(() => {
            $(e.currentTarget).parent().removeClass(hoverStateClassName);
        });
    };

    // mouseover
    bean.on(document.body, 'mouseenter', overlaySelector, showIntentToClick);
    // mouseout
    bean.on(document.body, 'mouseleave', overlaySelector, removeIntentToClick);
}
