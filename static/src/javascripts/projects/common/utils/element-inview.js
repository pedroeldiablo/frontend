import bean from 'bean';
import debounce from 'lodash/functions/debounce';
import assign from 'lodash/objects/assign';

// Be sure to wrap your event functions with fastdom as this doesn't assume DOM manipulation
function noop() {}

function elementIsInView(el, offsets_) {
    const offsets = assign({}, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    }, offsets_);

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const fromTop = rect.top + offsets.top;
    const fromBottom = rect.bottom - offsets.bottom;
    const fromLeft = rect.left - offsets.left;
    const fromRight = rect.right + offsets.right;

    const visibleVertically = fromTop < viewportHeight && fromBottom > 0;
    const visibleHorizontally = fromLeft < viewportWidth && fromRight > 0;

    return visibleVertically && visibleHorizontally;
}


function ElementInview(element, container, offsets) {
    let hasBeenSeen = false;

    const events = {
        firstview: noop,
    };

    bean.on(container, 'scroll', debounce(() => {
        const inView = elementIsInView(element, offsets);

        if (inView) {
            if (!hasBeenSeen) {
                hasBeenSeen = true;
                events.firstview(element);
            }
        }
    }, 200));

    return {
        on(event, func) {
            events[event] = func;
        },
    };
}

export default ElementInview;
