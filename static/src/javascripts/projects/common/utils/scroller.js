import easing from 'common/utils/easing';
import bonzo from 'bonzo';
import fastdom from 'fastdom';

// utility module for auto scrolling with easing
// Usage:
// scroller.scrollToElement(element, 500, 'easeOutQuad'); // 500ms scroll to element using easeOutQuad easing
// scroller.scrollTo(1250, 250, 'linear'); // 250ms scroll to 1250px using linear gradient
// scroller.scrollTo(100, 250, 'linear', document.querySelector('.container')); // 250ms scroll to 100px of scrollable container
//   if you pass in an element, you must also specify an easing function.
function scrollTo(offset, duration, easeFn, container) {
    let $container = bonzo(container || document.body),
        scrollEnd = offset,
        scrollFrom = $container.scrollTop(),
        scrollDist = scrollEnd - scrollFrom,
        ease = easing.create(easeFn || 'easeOutQuad', duration),
        scrollFn = function () {
            fastdom.write(() => {
                $container.scrollTop(scrollFrom + (ease() * scrollDist));
            });
        },
        interval = window.setInterval(scrollFn, 15);
    window.setTimeout(() => {
        window.clearInterval(interval);
        fastdom.write(() => {
            $container.scrollTop(scrollEnd);
        });
    }, duration);
}

function scrollToElement(element, duration, easeFn) {
    const top = bonzo(element).offset().top;
    scrollTo(top, duration, easeFn);
}

export default {
    scrollToElement,
    scrollTo,
};
