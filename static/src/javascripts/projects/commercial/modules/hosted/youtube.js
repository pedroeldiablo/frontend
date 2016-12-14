
import nextVideoAutoplay from 'commercial/modules/hosted/next-video-autoplay';
import youtubePlayer from 'common/modules/atoms/youtube-player';
import tracking from 'common/modules/atoms/youtube-tracking';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import contains from 'lodash/collections/contains';
import forEach from 'lodash/collections/forEach';
const eventsFired = [];

function isDesktop() {
    return contains(['desktop', 'leftCol', 'wide'], detect.getBreakpoint());
}

function sendPercentageCompleteEvents(atomId, youtubePlayer, playerTotalTime) {
    const quartile = playerTotalTime / 4;
    const playbackEvents = {
        25: quartile,
        50: quartile * 2,
        75: quartile * 3,
    };

    forEach(playbackEvents, (value, key) => {
        if (!contains(eventsFired, key) && youtubePlayer.getCurrentTime() > value) {
            tracking.track(key, atomId);
            eventsFired.push(key);
            mediator.emit(key);
        }
    });
}

function init(el) {
    const atomId = $(el).data('media-id');
    const duration = $(el).data('duration');
    const $currentTime = $('.js-youtube-current-time');
    let playTimer;

    tracking.init(atomId);
    youtubePlayer.init(el, {
        onPlayerStateChange(event) {
            const player = event.target;

            // show end slate when movie finishes
            if (event.data === window.YT.PlayerState.ENDED) {
                tracking.track('end', atomId);
                $currentTime.text('0:00');
                if (nextVideoAutoplay.canAutoplay()) {
                    // on mobile show the next video link in the end of the currently watching video
                    if (!isDesktop()) {
                        nextVideoAutoplay.triggerEndSlate();
                    }
                }
            } else {
                // update current time
                const currentTime = Math.floor(player.getCurrentTime());
                const seconds = currentTime % 60;
                const minutes = (currentTime - seconds) / 60;
                $currentTime.text(minutes + (seconds < 10 ? ':0' : ':') + seconds);
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
                tracking.track('play', atomId);
                const playerTotalTime = player.getDuration();
                playTimer = setInterval(() => {
                    sendPercentageCompleteEvents(atomId, player, playerTotalTime);
                }, 1000);
            } else {
                clearTimeout(playTimer);
            }
        },
        onPlayerReady(event) {
            if (nextVideoAutoplay.canAutoplay() && isDesktop()) {
                nextVideoAutoplay.addCancelListener();
                nextVideoAutoplay.triggerAutoplay(event.target.getCurrentTime.bind(event.target), duration);
            }
        },
    }, el.id);
}

export default {
    init,
};
