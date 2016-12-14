import $ from 'common/utils/$';
import bonzo from 'bonzo';
import filter from 'lodash/collections/filter';
const $rhc = $('.js-components-container');

/**
 * @param {Element|Bonzo} c
 * @param {number} importance number (optional)
 */
function addComponent(c, importance) {
    importance = importance || 1;
    const classname = 'component--rhc';
    let $cs;

    return $.create(`<div class="${classname}" data-importance="${importance}"></div>`)
        .append(c)
        .each((el) => {
            $cs = $(`.${classname}`, $rhc[0]);
            const inferior = filter($cs, el => !el.hasAttribute('data-importance') ||
                    importance > parseInt(el.getAttribute('data-importance'), 10));
            if (inferior.length === 0) {
                $rhc.append(el);
            } else {
                bonzo(inferior[0]).before(el);
            }
        });
}

export default {
    addComponent,
};
