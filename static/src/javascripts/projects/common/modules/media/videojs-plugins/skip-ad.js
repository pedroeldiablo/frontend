import qwery from 'qwery';
import bean from 'bean';
import $ from 'common/utils/$';
import template from 'common/utils/template';
import adsSkipOverlayTemplate from 'text!common/views/ui/video-ads-skip-overlay.html';

function skipAd(mediaType, skipTimeout) {
    let intervalId;
    const events = {
        update() {
            let adsManager = this.ima.getAdsManager();
            let currentTime = adsManager.getCurrentAd().getDuration() - adsManager.getRemainingTime();
            let skipTime = parseInt((skipTimeout - currentTime).toFixed(), 10);

            if (skipTime > 0) {
                $('.js-skip-remaining-time', this.el()).text(skipTime);
            } else {
                window.clearInterval(intervalId);
                $('.js-ads-skip', this.el())
                    .html(
                        '<button class="js-ads-skip-button vjs-ads-skip__button" data-link-name="Skip video advert">' +
                        '<i class="i i-play-icon-grey skip-icon"></i>' +
                        '<i class="i i-play-icon-gold skip-icon"></i>Skip advert' +
                        '</button>'
                    );
                bean.on(qwery('.js-ads-skip-button')[0], 'click', events.skip.bind(this));
            }
        },
        skip() {
            $('.js-ads-skip', this.el()).hide();
            this.trigger(`${mediaType}:preroll:skip`);
            // This is to follow more closely the videojs convention
            this.trigger('adskip');
            // in lieu of a 'skip' api, rather hacky way of achieving it
            this.ima.onAdComplete_();
            this.ima.onContentResumeRequested_();
            this.ima.getAdsManager().stop();
        },
        init() {
            const adDuration = this.ima.getAdsManager().getCurrentAd().getDuration();

            const skipButton = template(adsSkipOverlayTemplate, {
                adDuration,
                skipTimeout,
            });

            $(this.el()).append(skipButton);
            intervalId = setInterval(events.update.bind(this), 500);
        },
        end() {
            $('.js-ads-skip', this.el()).hide();
            window.clearInterval(intervalId);
        },
    };

    this.one(`${mediaType}:preroll:play`, events.init.bind(this));
    this.one(`${mediaType}:preroll:end`, events.end.bind(this));
}

export default skipAd;
