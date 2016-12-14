/**
 Hosted video
 */

import Promise from 'Promise';
import hostedYoutube from 'commercial/modules/hosted/youtube';
import nextVideoAutoplay from 'commercial/modules/hosted/next-video-autoplay';
import $ from 'common/utils/$';
import deferToAnalytics from 'common/utils/defer-to-analytics';
import detect from 'common/utils/detect';
import reportError from 'common/utils/report-error';
import events from 'common/modules/video/events';
import videojsOptions from 'common/modules/video/videojs-options';
import fullscreener from 'common/modules/media/videojs-plugins/fullscreener';
import contains from 'lodash/collections/contains';
import loadingTmpl from 'text!common/views/ui/loading.html';
let player;

function isDesktop() {
    return contains(['desktop', 'leftCol', 'wide'], detect.getBreakpoint());
}

function initLoadingSpinner(player) {
    player.loadingSpinner.contentEl().innerHTML = loadingTmpl;
}

function upgradeVideoPlayerAccessibility(player) {
    // Set the video tech element to aria-hidden, and label the buttons in the videojs control bar.
    $('.vjs-tech', player.el()).attr('aria-hidden', true);

    // Hide superfluous controls, and label useful buttons.
    $('.vjs-big-play-button', player.el()).attr('aria-hidden', true);
    $('.vjs-current-time', player.el()).attr('aria-hidden', true);
    $('.vjs-time-divider', player.el()).attr('aria-hidden', true);
    $('.vjs-duration', player.el()).attr('aria-hidden', true);
    $('.vjs-embed-button', player.el()).attr('aria-hidden', true);

    $('.vjs-play-control', player.el()).attr('aria-label', 'video play');
    $('.vjs-mute-control', player.el()).attr('aria-label', 'video mute');
    $('.vjs-fullscreen-control', player.el()).attr('aria-label', 'video fullscreen');
}

function init() {
    return new Promise((resolve) => {
        require(['bootstraps/enhanced/media/main'], () => {
            require(['bootstraps/enhanced/media/video-player'], (videojs) => {
                let $videoEl = $('.vjs-hosted__video');
                const $inlineVideoEl = $('video');
                const $youtubeIframe = $('.js-hosted-youtube-video');

                if ($youtubeIframe.length === 0 && $videoEl.length === 0) {
                    if ($inlineVideoEl.length === 0) {
                        // halt execution
                        return resolve();
                    } else {
                        $videoEl = $inlineVideoEl;
                    }
                }

                $videoEl.each(function (el) {
                    const mediaId = $videoEl.attr('data-media-id');
                    player = videojs(el, videojsOptions());
                    player.guMediaType = 'video';
                    videojs.plugin('fullscreener', fullscreener);

                    events.addContentEvents(player, mediaId, player.guMediaType);
                    events.bindGoogleAnalyticsEvents(player, window.location.pathname);

                    player.ready(function () {
                        let vol;
                        const player = this;
                        initLoadingSpinner(player);
                        upgradeVideoPlayerAccessibility(player);

                        // unglitching the volume on first load
                        vol = player.volume();
                        if (vol) {
                            player.volume(0);
                            player.volume(vol);
                        }

                        player.fullscreener();

                        deferToAnalytics(() => {
                            events.initOphanTracking(player, mediaId);
                            events.bindGlobalEvents(player);
                            events.bindContentEvents(player);
                        });

                        player.on('error', () => {
                            const err = player.error();
                            if (err && 'message' in err && 'code' in err) {
                                reportError(new Error(err.message), {
                                    feature: 'hosted-player',
                                    vjsCode: err.code,
                                }, false);
                            }
                        });
                    });

                    if (nextVideoAutoplay.canAutoplay()) {
                        // on desktop show the next video link 10 second before the end of the currently watching video
                        if (isDesktop()) {
                            nextVideoAutoplay.addCancelListener();
                            player && player.one('timeupdate', nextVideoAutoplay.triggerAutoplay.bind(this, player.currentTime.bind(player), parseInt($videoEl.data('duration'), 10)));
                        } else {
                            player && player.one('ended', nextVideoAutoplay.triggerEndSlate);
                        }
                    }
                });

                $youtubeIframe.each((el) => {
                    hostedYoutube.init(el);
                });

                resolve();
            });
        });
    });
}

export default {
    init,
};
