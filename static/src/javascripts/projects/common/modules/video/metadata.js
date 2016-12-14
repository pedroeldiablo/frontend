import ajax from 'common/utils/ajax';
import config from 'common/utils/config';
import Promise from 'Promise';

function isGeoBlocked(el) {
    const source = el.currentSrc;

    // we currently only block to the uk
    // these files are placed in a special location
    if (source.indexOf('/ukonly/') !== -1) {
        return new Promise((resolve) => {
            ajax({
                url: source,
                crossOrigin: true,
                method: 'head',
            }).then(() => {
                resolve(false);
            }, (response) => {
                // videos are blocked at the CDN level
                resolve(response.status === 403);
            });
        });
    } else {
        return new Promise((resolve) => {
            resolve(false);
        });
    }
}

function getVideoInfo($el) {
    const shouldHideAdverts = $el.attr('data-block-video-ads') !== 'false';
    const embedPath = $el.attr('data-embed-path');

    // we need to look up the embedPath for main media videos
    const canonicalUrl = $el.attr('data-canonical-url') || (embedPath ? embedPath : null);

    return new Promise((resolve) => {
        // We only have the canonical URL in videos embedded in articles / main media.
        // These are set to the safest defaults that will always play video.
        const defaultVideoInfo = {
            expired: false,
            shouldHideAdverts,
        };

        if (!canonicalUrl) {
            resolve(defaultVideoInfo);
        } else {
            const ajaxInfoUrl = `${config.page.ajaxUrl}/${canonicalUrl}`;

            ajax({
                url: `${ajaxInfoUrl}/info.json`,
                type: 'json',
                crossOrigin: true,
            }).then((videoInfo) => {
                resolve(videoInfo);
            }, () => {
                // if this fails, don't stop, keep going.
                resolve(defaultVideoInfo);
            });
        }
    });
}

export default {
    isGeoBlocked,
    getVideoInfo,
};
