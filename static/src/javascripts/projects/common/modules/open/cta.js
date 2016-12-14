import $ from 'common/utils/$';
import clamp from 'common/utils/clamp';
import Component from 'common/modules/component';

/** @constructor */
var Cta = function(mediator, options) {
    this.mediator = mediator;
    this.setOptions(options);
};
Component.define(Cta);

/**
 * @type {string}
 * @override
 */
Cta.prototype.endpoint = '/open/cta/article/:discussionKey.json';

/**
 * @override
 * @type {string}
 */
Cta.prototype.componentClass = 'comment';

/**
 * @override
 * @type {Boolean}
 */
Cta.prototype.useBem = true;

/** @type {Object.<string.*>} */
Cta.prototype.defaultOptions = {
    discussionKey: null
};

/** @override */
Cta.prototype.prerender = function() {
    var comments = $('.comment', this.elem),
        comment = comments[Math.floor(Math.random() * comments.length) + 0];

    if (comments.length === 0) {
        this.destroy();
    } else {
        this.elem = comment;
    }
};

/** @override */
Cta.prototype.ready = function() {
    clamp(this.getElem('body'), 10, true);
};

export default Cta;
