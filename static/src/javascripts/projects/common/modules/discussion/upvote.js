import assign from 'common/utils/assign';
import fastdom from 'common/utils/fastdom-promise';
import reportError from 'common/utils/report-error';
import urlUtil from 'common/utils/url';
import Promise from 'Promise';
const RECOMMENDATION_CLASS = 'js-recommend-comment';
const TOOLTIP_CLASS = 'js-rec-tooltip';

function handle(target, container, user, discussionApi, allowAnonymousRecommends) {
    if (!allowAnonymousRecommends && !user) {
        target.setAttribute('data-link-name', 'Recommend comment anonymous');
        return showSignInTooltip(target);
    } else if ((allowAnonymousRecommends || user) && isOpenForRecommendations(container)) {
        const id = target.getAttribute('data-comment-id');

        return Promise.all([
            setClicked(target),
            discussionApi.recommendComment(id),
        ])
            .then(() => setRecommended(target))
            .catch((ex) => {
                unsetClicked(target);
                reportError(ex, {
                    feature: 'comments-recommend',
                });
            });
    }
}

function isOpenForRecommendations(element) {
    return !!element.querySelector('.d-discussion--recommendations-open');
}

function setClicked(target) {
    return fastdom.write(() => {
        target.classList.remove(RECOMMENDATION_CLASS);
        target.classList.add('d-comment__recommend--clicked');
    });
}

function unsetClicked(target) {
    return fastdom.write(() => {
        target.classList.add(RECOMMENDATION_CLASS);
        target.classList.remove('d-comment__recommend--clicked');
    });
}

function setRecommended(target) {
    return fastdom.write(() => {
        target.classList.add('d-comment__recommend--recommended');
    });
}

function showSignInTooltip(target) {
    const tooltip = document.querySelector(`.${TOOLTIP_CLASS}`);
    const links = tooltip.querySelectorAll('.js-rec-tooltip-link');

    return fastdom.write(() => {
        updateReturnUrl(links, target.getAttribute('data-comment-url'));
        tooltip.removeAttribute('hidden');
        target.appendChild(tooltip);
    });
}

function updateReturnUrl(links, returnLink) {
    for (let i = 0, len = links.length; i < len; i += 1) {
        const url = links[i].getAttribute('href');
        const baseUrl = url.split('?')[0];
        const query = urlUtil.getUrlVars({
            query: url.split('?')[1] || '&',
        });
        links[i].setAttribute('href', `${baseUrl}?${urlUtil.constructQuery(assign(query, {
            returnUrl: returnLink,
        }))}`);
    }
}

function closeTooltip() {
    return fastdom.write(() => {
        document.querySelector(`.${TOOLTIP_CLASS}`).setAttribute('hidden', '');
    });
}

export default {
    handle,
    closeTooltip,
};
