import bean from 'bean';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
export default function () {
    const $jsLm = $('.js-lm');

    if ($jsLm.length > 0) {
        fastdom.write(() => {
            $('.js-wpd').addClass('content__dateline-wpd--modified');
        });

        bean.on(qwery('.js-wpd')[0], 'click', () => {
            fastdom.write(() => {
                $jsLm.toggleClass('u-h');
            });
        });
    }
}
