/** Bootstrap for functionality common to articles and live blogs */
import fence from 'fence';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import robust from 'common/utils/robust';
import accessibility from 'common/modules/accessibility/helpers';
import twitter from 'common/modules/article/twitter';
import OpenCta from 'common/modules/open/cta';
import lastModified from 'common/modules/ui/last-modified';
import rhc from 'common/modules/ui/rhc';
import selectionSharing from 'common/modules/ui/selection-sharing';

function initOpenCta() {
    if (config.switches.openCta && config.page.commentable) {
        const openCta = new OpenCta(mediator, {
            discussionKey: config.page.shortUrlId || '',
        });

        $.create('<div class="open-cta"></div>').each((el) => {
            openCta.fetch(el);
            if (!config.page.isLiveBlog && !config.page.isMinuteArticle) {
                rhc.addComponent(el);
            }
        });
    }
}

function initFence() {
    $('.fenced').each((el) => {
        fence.render(el);
    });
}

function initTwitter() {
    twitter.init();
    twitter.enhanceTweets();
}

export default function () {
    robust.catchErrorsAndLogAll([
        ['trail-a11y', accessibility.shouldHideFlashingElements],
        ['trail-article', initOpenCta],
        ['trail-fence', initFence],
        ['trail-twitter', initTwitter],
        ['trail-sharing', selectionSharing.init],
        ['trail-last-modified', lastModified],
    ]);
}
