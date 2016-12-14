import fastdom from 'fastdom';
import bean from 'bean';
import $ from 'common/utils/$';

function toggleDisplay(e) {
    e && e.preventDefault();

    $('.js-social__secondary').each((icon) => {
        fastdom.write(() => {
            $(icon).toggleClass('social--hidden');
        });
    });

    $('.js-social--top').each((topSocial) => {
        fastdom.write(() => {
            $(topSocial).toggleClass('social--expanded-top');
        });
    });
}

export default function hiddenShareToggle() {
    $('.js-social__item--more, .js-social__tray-close').each((toggle) => {
        bean.on(toggle, 'click', toggleDisplay);
    });

    bean.on(document.body, 'click', (e) => {
        if ($.ancestor(e.target, 'js-social--top') || !$('.js-social--top').hasClass('social--expanded-top')) return;
        toggleDisplay();
    });

    fastdom.write(() => {
        $('.js-social__item--more').toggleClass('social--hidden');
    });
}
