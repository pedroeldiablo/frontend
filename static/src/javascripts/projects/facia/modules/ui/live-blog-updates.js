import bonzo from 'bonzo';
import relativeDates from 'common/modules/ui/relativedates';
import $ from 'common/utils/$';
import chain from 'common/utils/chain';
import detect from 'common/utils/detect';
import fastdomPromise from 'common/utils/fastdom-promise';
import fetchJson from 'common/utils/fetch-json';
import mediator from 'common/utils/mediator';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import blockTemplate from 'text!facia/views/liveblog-block.html';
import compact from 'lodash/arrays/compact';
import isUndefined from 'lodash/objects/isUndefined';
import forEach from 'lodash/collections/forEach';
import debounce from 'lodash/functions/debounce';
import filter from 'lodash/collections/filter';
import isEmpty from 'lodash/objects/isEmpty';
import map from 'lodash/collections/map';
let animateDelayMs = 2000;
let animateAfterScrollDelayMs = 500;
let refreshSecs = 30;
let refreshDecay = 1;
let refreshMaxTimes = 5;
let selector = '.js-liveblog-blocks';
let articleIdAttribute = 'data-article-id';
let sessionStorageKey = 'gu.liveblog.block-dates';
let veiwportHeightPx = detect.getViewport().height;

function blockRelativeTime(block) {
    let pubDate = (block || {}).publishedDateTime;
    let relDate = pubDate ? relativeDates.makeRelativeDate(new Date(pubDate)) : false;

    return relDate || '';
}

function renderBlock(articleId, block, index) {
    let relTime = blockRelativeTime(block);

    if (relTime.match(/yesterday/i)) {
        relTime = relTime.toLowerCase();
    } else if (relTime) {
        relTime = `Latest update ${relTime} ago`;
    } else {
        relTime = 'Updated just now';
    }

    return template(blockTemplate, {
        ariaHidden: !block.isNew,
        href: `/${articleId}#${block.id}`,
        relativeTime: relTime,
        text: compact([block.title, block.body.slice(0, 500)]).join('. '),
        index: index + 1,
    });
}

function showBlocks(articleId, targets, blocks, oldBlockDate) {
    const fakeUpdate = isUndefined(oldBlockDate);

    forEach(targets, (element) => {
        let hasNewBlock = false;

        let wrapperClasses = [
            'fc-item__liveblog-blocks__inner',
            'u-faux-block-link__promote',
        ];

        let blocksHtml = chain(blocks).slice(0, 2).and(map, (block, index) => {
            if (!hasNewBlock && (block.publishedDateTime > oldBlockDate || fakeUpdate)) {
                block.isNew = true;
                hasNewBlock = true;
                wrapperClasses.push('fc-item__liveblog-blocks__inner--offset');
            }
            return renderBlock(articleId, block, index);
        }).slice(0, hasNewBlock ? 2 : 1).value();

        let el = bonzo.create(
            `<div class="${wrapperClasses.join(' ')}">${blocksHtml.join('')}</div>`
        );

        let $element = bonzo(element);

        fastdomPromise.write(() => {
            $element.append(el);
        })
            .then(() => {
                if (hasNewBlock) {
                    animateBlocks(el[0]);
                }
            });
    });
}

function animateBlocks(el) {
    maybeAnimateBlocks(el)
        .then((didAnimate) => {
            let animateOnScroll;

            if (!didAnimate) {
                animateOnScroll = debounce(() => {
                    maybeAnimateBlocks(el, true).then((didAnimate) => {
                        if (didAnimate) {
                            mediator.off('window:throttledScroll', animateOnScroll);
                        }
                    });
                }, animateAfterScrollDelayMs);

                mediator.on('window:throttledScroll', animateOnScroll);
            }
        });
}

function maybeAnimateBlocks(el, immediate) {
    return fastdomPromise.read(() => el.getBoundingClientRect().top)
        .then((vPosition) => {
            if (vPosition > 0 && vPosition < veiwportHeightPx) {
                setTimeout(() => {
                    const $el = bonzo(el);

                    fastdomPromise.write(() => {
                        $el.removeClass('fc-item__liveblog-blocks__inner--offset');
                    });
                }, immediate ? 0 : animateDelayMs);
                return true;
            }
        });
}

function sanitizeBlocks(blocks) {
    return filter(blocks, block => block.id && block.publishedDateTime && block.body && block.body.length >= 10);
}

function show() {
    return fastdomPromise.read(() => {
        const elementsById = {};

        $(selector).each((element) => {
            const articleId = element.getAttribute(articleIdAttribute);

            if (articleId) {
                elementsById[articleId] = elementsById[articleId] || [];
                elementsById[articleId].push(element);
            }
        });
        return elementsById;
    })
        .then((elementsById) => {
            let oldBlockDates;

            if (!isEmpty(elementsById)) {
                oldBlockDates = storage.session.get(sessionStorageKey) || {};

                forEach(elementsById, (elements, articleId) => {
                    fetchJson(`/${articleId}.json?rendered=false`, {
                        mode: 'cors',
                    })
                        .then((response) => {
                            const blocks = response && sanitizeBlocks(response.blocks);

                            if (blocks && blocks.length) {
                                showBlocks(articleId, elements, blocks, oldBlockDates[articleId]);
                                oldBlockDates[articleId] = blocks[0].publishedDateTime;
                                storage.session.set(sessionStorageKey, oldBlockDates);
                            }
                        })
                        .catch(() => {});
                });

                if (refreshMaxTimes) {
                    refreshMaxTimes -= 1;
                    setTimeout(() => {
                        show();
                    }, refreshSecs * 1000);
                    refreshSecs *= refreshDecay;
                }
            }
        });
}

export default {
    show,
};
