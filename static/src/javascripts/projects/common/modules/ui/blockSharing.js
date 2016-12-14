import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import $ from 'common/utils/$';

let truncateBlockShareIcons = blockShareEl => {
        const truncated = qwery('> *', blockShareEl).slice(2);
        bonzo(truncated).addClass('u-h');
        $('.js-blockshare-expand', blockShareEl).removeClass('u-h');
    };

let initBlockSharing = () => {
    bean.on(document.body, 'click', '.js-blockshare-expand', (e) => {
        let expandButton = bonzo(e.currentTarget);
        let container = expandButton.parent()[0];
        $('> *', container).removeClass('u-h');
        expandButton.addClass('u-h');
    });
    $.forEachElement('.block-share', truncateBlockShareIcons);
};

export default {
    init: initBlockSharing,
    truncateBlockShareIcons,
};
