import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';

var truncateBlockShareIcons = function(blockShareEl) {
        var truncated = qwery('> *', blockShareEl).slice(2);
        bonzo(truncated).addClass('u-h');
        $('.js-blockshare-expand', blockShareEl).removeClass('u-h');
    },

    initBlockSharing = function() {
        bean.on(document.body, 'click', '.js-blockshare-expand', function(e) {
            var expandButton = bonzo(e.currentTarget),
                container = expandButton.parent()[0];
            $('> *', container).removeClass('u-h');
            expandButton.addClass('u-h');
        });
        $.forEachElement('.block-share', truncateBlockShareIcons);
    };

export default {
    init: initBlockSharing,
    truncateBlockShareIcons: truncateBlockShareIcons
};
