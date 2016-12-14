import bonzo from 'bonzo';
import fastdom from 'fastdom';
import qwery from 'qwery';
import $ from 'common/utils/$';
import ajax from 'common/utils/ajax';
import formatters from 'common/utils/formatters';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import commentCountTemplate from 'text!common/views/discussion/comment-count.html';
import commentCountContentTemplate from 'text!common/views/discussion/comment-count--content.html';
import commentCountContentImmersiveTemplate from 'text!common/views/discussion/comment-count--content-immersive.html';
import groupBy from 'lodash/collections/groupBy';
import forEach from 'lodash/collections/forEach';
import sortBy from 'lodash/collections/sortBy';
import uniq from 'lodash/arrays/uniq';
import keys from 'lodash/objects/keys';
import chain from 'common/utils/chain';
let attributeName = 'data-discussion-id',
    countUrl = '/discussion/comment-counts.json?shortUrls=',
    templates = {
        content: commentCountContentTemplate,
        contentImmersive: commentCountContentImmersiveTemplate,
    },
    defaultTemplate = commentCountTemplate;

function getElementsIndexedById(context) {
    const elements = qwery(`[${attributeName}]`, context);

    return groupBy(elements, el => bonzo(el).attr(attributeName));
}

function getContentIds(indexedElements) {
    return chain(indexedElements).and(keys).and(uniq).and(sortBy).join(',').value();
}

function getContentUrl(node) {
    const a = node.getElementsByTagName('a')[0];
    return `${a ? a.pathname : ''}#comments`;
}

function renderCounts(counts, indexedElements) {
    counts.forEach((c) => {
        forEach(indexedElements[c.id], (node) => {
            let format,
                $node = bonzo(node),
                url = $node.attr('data-discussion-url') || getContentUrl(node),
                $container,
                meta,
                html;

            if ($node.attr('data-discussion-closed') === 'true' && c.count === 0) {
                return; // Discussion is closed and had no comments, we don't want to show a comment count
            }

            format = $node.data('commentcount-format');
            html = template(templates[format] || defaultTemplate, {
                url,
                icon: svgs('commentCount16icon', ['inline-tone-fill']),
                count: formatters.integerCommas(c.count),
            });

            meta = qwery('.js-item__meta', node);
            $container = meta.length ? bonzo(meta) : $node;

            fastdom.write(() => {
                $container.append(html);
                $node.removeAttr(attributeName);
                $node.removeClass('u-h');
            });
        });
    });

    // This is the only way to ensure that this event is fired after all the comment counts have been rendered to
    // the DOM.
    fastdom.write(() => {
        mediator.emit('modules:commentcount:loaded', counts);
    });
}

function getCommentCounts(context) {
    fastdom.read(() => {
        let indexedElements = getElementsIndexedById(context || document.body),
            ids = getContentIds(indexedElements);
        ajax({
            url: countUrl + ids,
            type: 'json',
            method: 'get',
            crossOrigin: true,
            success(response) {
                if (response && response.counts) {
                    renderCounts(response.counts, indexedElements);
                }
            },
        });
    });
}

function init() {
    if (document.body.querySelector('[data-discussion-id]')) {
        getCommentCounts(document.body);
    }

    // Load new counts when more trails are loaded
    mediator.on('modules:related:loaded', getCommentCounts);
}

export default {
    init,
    getCommentCounts,
    getContentIds,
    getElementsIndexedById,
};
