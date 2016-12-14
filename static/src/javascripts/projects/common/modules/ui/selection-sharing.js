import bean from 'bean';
import bonzo from 'bonzo';
import $ from 'common/utils/$';
import clientRects from 'common/utils/client-rects';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import sharingTemplate from 'text!common/views/ui/selection-sharing.html';
import svgs from 'common/views/svgs';
import debounce from 'lodash/functions/debounce';
import throttle from 'lodash/functions/throttle';
import some from 'lodash/collections/some';

var $body = bonzo(document.body),
    twitterIcon = svgs('shareTwitter', ['icon', 'centered-icon']),
    emailIcon = svgs('shareEmail', ['icon', 'centered-icon']),
    selectionSharing = template(sharingTemplate, {
        twitterIcon: twitterIcon,
        emailIcon: emailIcon
    }),
    $selectionSharing = $.create(selectionSharing),
    $twitterAction,
    $emailAction,
    twitterShortUrl = config.page.shortUrl + '/stw',
    twitterHrefTemplate = 'https://twitter.com/intent/tweet?text=%E2%80%9C<%=text%>%E2%80%9D&url=<%=url%>',
    twitterMessageLimit = 114, // 140 - t.co length - 3 chars for quotes and url spacing
    emailShortUrl = config.page.shortUrl + '/sbl',
    emailHrefTemplate = 'mailto:?subject=<%=subject%>&body=%E2%80%9C<%=selection%>%E2%80%9D <%=url%>',
    validAncestors = ['js-article__body', 'content__standfirst', 'block', 'caption--main', 'content__headline'],

    isValidSelection = function(range) {
        // commonAncestorContainer is buggy, can't use it here.
        return some(validAncestors, function(className) {
            return $.ancestor(range.startContainer, className) && $.ancestor(range.endContainer, className);
        });
    },

    hideSelection = function() {
        if ($selectionSharing.hasClass('selection-sharing--active')) {
            $selectionSharing.removeClass('selection-sharing--active');
        }
    },

    showSelection = function() {
        if (!$selectionSharing.hasClass('selection-sharing--active')) {
            $selectionSharing.addClass('selection-sharing--active');
        }
    },

    updateSelection = function() {

        var selection = window.getSelection && document.createRange && window.getSelection(),
            range,
            rect,
            top,
            twitterMessage,
            twitterHref,
            emailHref;

        if (selection && selection.rangeCount > 0 && selection.toString()) {
            range = selection.getRangeAt(0);
            rect = clientRects.getBoundingClientRect(range);
            top = $body.scrollTop() + rect.top;
            twitterMessage = range.toString();

            if (!isValidSelection(range)) {
                hideSelection();
                return;
            }

            // Truncate the twitter message.
            if (twitterMessage.length > twitterMessageLimit) {
                twitterMessage = twitterMessage.slice(0, twitterMessageLimit - 1) + '…';
            }

            twitterHref = template(twitterHrefTemplate, {
                text: encodeURIComponent(twitterMessage),
                url: encodeURI(twitterShortUrl)
            });
            emailHref = template(emailHrefTemplate, {
                subject: encodeURI(config.page.webTitle),
                selection: encodeURI(range.toString()),
                url: encodeURI(emailShortUrl)
            });

            $twitterAction.attr('href', twitterHref);
            $emailAction.attr('href', emailHref);

            $selectionSharing.css({
                top: top + 'px',
                left: rect.left + 'px'
            });

            showSelection();
        } else {
            hideSelection();
        }
    },

    onMouseDown = function(event) {
        if (!$.ancestor(event.target, 'social__item')) {
            hideSelection();
        }
    },

    initSelectionSharing = function() {
        // The current mobile Safari returns absolute Rect co-ordinates (instead of viewport-relative),
        // and the UI is generally fiddly on touch.
        if (!detect.hasTouchScreen()) {
            $body.append($selectionSharing);
            $twitterAction = $('.js-selection-twitter');
            $emailAction = $('.js-selection-email');
            // Set timeout ensures that any existing selection has been cleared.
            bean.on(document.body, 'keypress keydown keyup', debounce(updateSelection, 50));
            bean.on(document.body, 'mouseup', debounce(updateSelection, 200));
            bean.on(document.body, 'mousedown', debounce(onMouseDown, 50));
            mediator.on('window:resize', throttle(updateSelection, 50));
        }
    };

export default {
    init: initSelectionSharing,
    updateSelection: updateSelection
};
