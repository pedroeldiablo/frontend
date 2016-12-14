/*
    Module: autoupdate.js
    Description: Used to load update fragments of the DOM from specfied endpoint
*/
import fastdom from 'common/utils/fastdom-promise';
import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';
import ajax from 'common/utils/ajax';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import twitter from 'common/modules/article/twitter';
import NotificationBar from 'common/modules/live/notification-bar';
import assign from 'lodash/objects/assign';
import Sticky from 'common/modules/ui/sticky';
import scroller from 'common/utils/scroller';
import toArray from 'lodash/collections/toArray';
import bindAll from 'lodash/functions/bindAll';
import RelativeDates from 'common/modules/ui/relativedates';
import NotificationCounter from 'common/modules/ui/notification-counter';
import youtube from 'common/modules/atoms/youtube';

export default function (opts) {
    const options = assign({
        toastOffsetTop: 12, // pixels from the top
        minUpdateDelay: (detect.isBreakpoint({
            min: 'desktop',
        }) ? 10 : 30) * 1000, // 10 or 30 seconds minimum, depending on breakpoint
        maxUpdateDelay: 20 * 60 * 1000, // 20 mins
        backoffMultiplier: 0.75, // increase or decrease the back off rate by modifying this
    }, opts);

    // Cache selectors
    const $liveblogBody = $('.js-liveblog-body');
    const $toastButton = $('.toast__button');
    const $toastText = $('.toast__text', this.$toastButton);
    const toastContainer = qwery('.toast__container')[0];

    // Warning: these are re-assigned over time
    let currentUpdateDelay = options.minUpdateDelay;
    let latestBlockId = $liveblogBody.data('most-recent-block');
    let unreadBlocksNo = 0;
    let updateTimeoutId;


    const updateDelay = function (delay) {
        let newDelay;
        if (detect.pageVisible()) {
            newDelay = options.minUpdateDelay;
        } else {
            newDelay = Math.min(delay * 1.5, options.maxUpdateDelay);
        }
        currentUpdateDelay = newDelay;
    };

    const scrolledPastTopBlock = function () {
        return $liveblogBody.offset().top < window.pageYOffset;
    };
    const isLivePage = window.location.search.indexOf('?page=') === -1;

    const revealInjectedElements = function () {
        fastdom.write(() => {
            $('.autoupdate--hidden', $liveblogBody).addClass('autoupdate--highlight').removeClass('autoupdate--hidden');
            mediator.emit('modules:autoupdate:unread', 0);
        });
    };

    const toastButtonRefresh = function () {
        fastdom.write(() => {
            if (unreadBlocksNo > 0) {
                const updateText = (unreadBlocksNo > 1) ? ' new updates' : ' new update';
                $toastButton.removeClass('toast__button--closed');
                $(toastContainer).addClass('toast__container--open');
                $toastText.html(unreadBlocksNo + updateText);
            } else {
                $toastButton.removeClass('loading').addClass('toast__button--closed');
                $(toastContainer).removeClass('toast__container--open');
            }
        });
    };

    const injectNewBlocks = function (newBlocks) {
        // Clean up blocks before insertion
        const resultHtml = $.create(`<div>${newBlocks}</div>`)[0];
        let elementsToAdd;

        fastdom.write(() => {
            bonzo(resultHtml.children).addClass('autoupdate--hidden');
            elementsToAdd = toArray(resultHtml.children);

            // Insert new blocks
            $liveblogBody.prepend(elementsToAdd);

            mediator.emit('modules:autoupdate:updates', elementsToAdd.length);

            RelativeDates.init();
            twitter.enhanceTweets();
            youtube.checkElemsForVideos(elementsToAdd);
        });
    };

    const displayNewBlocks = function () {
        if (detect.pageVisible()) {
            revealInjectedElements();
        }

        unreadBlocksNo = 0;
        toastButtonRefresh();
    };

    const checkForUpdates = function () {
        if (updateTimeoutId != undefined) {
            clearTimeout(updateTimeoutId);
        }

        const shouldFetchBlocks = `&isLivePage=${isLivePage ? 'true' : 'false'}`;
        const latestBlockIdToUse = ((latestBlockId) ? latestBlockId : 'block-0');
        let count = 0;

        return ajax({
            url: `${window.location.pathname}.json?lastUpdate=${latestBlockIdToUse}${shouldFetchBlocks}`,
            type: 'json',
            method: 'get',
            crossOrigin: true,
        }).then((resp) => {
            count = resp.numNewBlocks;

            if (count > 0) {
                unreadBlocksNo += count;

                // updates notification bar with number of unread blocks
                mediator.emit('modules:autoupdate:unread', unreadBlocksNo);

                latestBlockId = resp.mostRecentBlockId;

                if (isLivePage) {
                    injectNewBlocks(resp.html);
                    if (scrolledPastTopBlock()) {
                        toastButtonRefresh();
                    } else {
                        displayNewBlocks();
                    }
                } else {
                    toastButtonRefresh();
                }
            }
        }).always(() => {
            if (count == 0 || currentUpdateDelay > 0) {
                updateDelay(currentUpdateDelay);
                updateTimeoutId = setTimeout(checkForUpdates, currentUpdateDelay);
            } else {
                // might have been cached so check straight away
                updateTimeoutId = setTimeout(checkForUpdates, 1);
            }
        });
    };

    const setUpListeners = function () {
        bean.on(document.body, 'click', '.toast__button', () => {
            if (isLivePage) {
                fastdom.read(() => {
                    scroller.scrollToElement(qwery('.blocks')[0], 300, 'easeOutQuad');

                    fastdom.write(() => {
                        $toastButton.addClass('loading');
                    }).then(() => {
                        displayNewBlocks();
                    });
                });
            } else {
                location.assign(window.location.pathname);
            }
        });

        mediator.on('modules:toast__tofix:unfixed', () => {
            if (isLivePage && unreadBlocksNo > 0) {
                fastdom.write(() => {
                    $toastButton.addClass('loading');
                }).then(() => {
                    displayNewBlocks();
                });
            }
        });

        mediator.on('modules:detect:pagevisibility:visible', () => {
            if (unreadBlocksNo == 0) {
                revealInjectedElements();
            }
            currentUpdateDelay = 0; // means please get us fully up to date
            checkForUpdates();
        });
    };

    //
    // init
    //

    new NotificationCounter().init();
    new Sticky(toastContainer, {
        top: options.toastOffsetTop,
        emitMessage: true,
        containInParent: false,
    }).init();

    checkForUpdates();
    detect.initPageVisibility();
    setUpListeners();

    fastdom.write(() => {
        // Enables the animations for injected blocks
        $liveblogBody.addClass('autoupdate--has-animation');
    });
}
