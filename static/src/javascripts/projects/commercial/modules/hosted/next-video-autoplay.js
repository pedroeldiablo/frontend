import bean from 'bean';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import googleAnalytics from 'common/modules/analytics/google';
let nextVideoInterval;
const $hostedNext = $('.js-hosted-next-autoplay');
const $timer = $('.js-autoplay-timer');
const nextVideoPage = $timer.length && $timer.data('next-page');

function cancelAutoplay() {
    fastdom.write(() => {
        $hostedNext.addClass('hosted-slide-out');
    });
    clearInterval(nextVideoInterval);
}

function cancelAutoplayMobile($hostedNext) {
    fastdom.write(() => {
        $hostedNext.addClass('u-h');
    });
}

function triggerAutoplay(getCurrentTimeFn, duration) {
    nextVideoInterval = setInterval(() => {
        const timeLeft = duration - Math.floor(getCurrentTimeFn());
        const countdownLength = 10; // seconds before the end when to show the timer

        if (timeLeft <= countdownLength) {
            fastdom.write(() => {
                $hostedNext.addClass('js-autoplay-start');
                $timer.text(`${timeLeft}s`);
            });
        }
        if (timeLeft <= 0) {
            googleAnalytics.trackNonClickInteraction('Immediately play the next video');
            window.location = nextVideoPage;
        }
    }, 1000);
}

function triggerEndSlate() {
    fastdom.write(() => {
        $hostedNext.addClass('js-autoplay-start');
    });
    bean.on(document, 'click', $('.js-autoplay-cancel'), () => {
        cancelAutoplayMobile($hostedNext);
    });
}

function addCancelListener() {
    bean.on(document, 'click', $('.js-autoplay-cancel'), () => {
        cancelAutoplay();
    });
}

function canAutoplay() {
    return $hostedNext.length && nextVideoPage;
}

export default {
    canAutoplay,
    triggerEndSlate,
    triggerAutoplay,
    addCancelListener,
};
