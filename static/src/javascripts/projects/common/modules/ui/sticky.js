import bonzo from 'bonzo';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import fastdom from 'fastdom';
import defaults from 'lodash/objects/defaults';

let paidforBandHeight;

function initPaidForBand(element) {
    paidforBandHeight = 0;
    if (config.page.isAdvertisementFeature) {
        const paidforBand = document.querySelector('.paidfor-band');
        if (paidforBand && paidforBand !== element) {
            fastdom.read(() => {
                paidforBandHeight = paidforBand.offsetHeight;
            });
        }
    }
}

/**
 * @todo: check if browser natively supports "position: sticky"
 */
function Sticky(element, options) {
    this.element = element;
    this.opts = defaults(options || {}, {
        top: 0,
        containInParent: true,
        emitMessage: false,
    });
}

Sticky.prototype.init = function init() {
    if (paidforBandHeight === undefined) {
        initPaidForBand(this.element);
    }
    mediator.on('window:throttledScroll', this.updatePosition.bind(this));
    // kick off an initial position update
    fastdom.read(this.updatePosition, this);
};

Sticky.prototype.updatePosition = function updatePosition() {
    const parentRect = this.element.parentNode.getBoundingClientRect();
    const elementHeight = this.element.offsetHeight;
    let css = {},
        message,
        stick;

    // have we scrolled past the element
    if (parentRect.top < this.opts.top + paidforBandHeight) {
        // make sure the element stays within its parent
        const fixedTop = this.opts.containInParent && parentRect.bottom < this.opts.top + elementHeight ?
            Math.floor(parentRect.bottom - elementHeight - this.opts.top) :
            this.opts.top;
        stick = true;
        css = {
            top: fixedTop,
        };
        message = 'fixed';
    } else {
        stick = false;
        css = {
            top: 0,
        };
        message = 'unfixed';
    }

    if (this.opts.emitMessage && message && message !== this.lastMessage) {
        this.emitMessage(message);
        this.lastMessage = message;
    }

    if (css) {
        fastdom.write(function () {
            if (stick) {
                bonzo(this.element).addClass('is-sticky').css(css);
            } else {
                bonzo(this.element).removeClass('is-sticky').css(css);
            }
        }, this);
    }
};

Sticky.prototype.emitMessage = function emitMessage(message) {
    mediator.emit(`modules:${this.element.id}:${message}`);
};

export default Sticky;
