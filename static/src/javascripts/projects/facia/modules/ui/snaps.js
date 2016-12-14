import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import fetch from 'common/utils/fetch';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import toArray from 'common/utils/to-array';
import proximityLoader from 'common/utils/proximity-loader';
import reportError from 'common/utils/report-error';
import relativeDates from 'common/modules/ui/relativedates';
import FootballSnaps from 'facia/modules/ui/football-snaps';
import once from 'lodash/functions/once';
import find from 'lodash/collections/find';
import debounce from 'lodash/functions/debounce';
import Promise from 'Promise';
let clientProcessedTypes = ['document', 'fragment', 'json.html'];
let snapIframes = [];

let bindIframeMsgReceiverOnce = once(() => {
    bean.on(window, 'message', (event) => {
        let iframe = find(snapIframes, iframe => iframe.contentWindow === event.source),
            message;
        if (iframe) {
            message = JSON.parse(event.data);
            if (message.type === 'set-height') {
                bonzo(iframe).parent().css('height', message.value);
            }
        }
    });
});

function init() {
    // First, init any existing inlined embeds already on the page.
    const inlinedSnaps = toArray($('.facia-snap-embed'));
    inlinedSnaps.forEach(initInlinedSnap);

    // Second, init non-inlined embeds.
    const snaps = toArray($('.js-snappable.js-snap'))
        .filter((el) => {
        let isInlinedSnap = $(el).hasClass('facia-snap-embed');
        let snapType = el.getAttribute('data-snap-type');
        return !isInlinedSnap && snapType && clientProcessedTypes.indexOf(snapType) > -1;
    })
        .filter(el => el.getAttribute('data-snap-uri'));

    snaps.forEach(initStandardSnap);
}

function addCss(el, isResize) {
    setSnapPoint(el, isResize);
    if ($(el).hasClass('facia-snap--football')) {
        FootballSnaps.resizeIfPresent(el);
    }
}

function setSnapPoint(el, isResize) {
    let width;
    let breakpoints;
    let $el = bonzo(el);
    let prefix = 'facia-snap-point--';

    breakpoints = [{
        width: 0,
        name: 'tiny',
    }, {
        width: 180,
        name: 'mini',
    }, {
        width: 220,
        name: 'small',
    }, {
        width: 300,
        name: 'medium',
    }, {
        width: 700,
        name: 'large',
    }, {
        width: 940,
        name: 'huge',
    }];

    fastdom.read(() => {
        width = el.offsetWidth;
    });

    fastdom.write(() => {
        breakpoints.map((breakpoint, i, arr) => {
            const isAdd = width >= breakpoint.width && (arr[i + 1] ? width < arr[i + 1].width : true);
            breakpoint.action = isAdd ? 'addClass' : isResize ? 'removeClass' : false;
            return breakpoint;
        })
            .filter(breakpoint => breakpoint.action)
            .forEach((breakpoint) => {
                $el[breakpoint.action](prefix + breakpoint.name);
            });
    });
}

function injectIframe(el) {
    let spec = bonzo(el).offset();
    let minIframeHeight = Math.ceil((spec.width || 0) / 2);
    let maxIframeHeight = 400;
    let src = el.getAttribute('data-snap-uri');
    let height = Math.min(Math.max(spec.height || 0, minIframeHeight), maxIframeHeight);

    let containerEl = bonzo.create(`<div style="width: 100%; height: ${height}px; ` +
        'overflow: hidden; -webkit-overflow-scrolling:touch"></div>')[0];

    let iframe = bonzo.create(`<iframe src="${src}" style="width: 100%; height: 100%; border: none;"></iframe>`)[0];

    bonzo(containerEl).append(iframe);
    snapIframes.push(iframe);
    bindIframeMsgReceiverOnce();

    fastdom.write(() => {
        bonzo(el).empty().append(containerEl);
    });
}

function fetchFragment(el, asJson) {
    fetch(el.getAttribute('data-snap-uri'), {
        mode: 'cors',
    }).then((resp) => {
        if (resp.ok) {
            return asJson ? resp.json().then(json => json.html) : resp.text();
        } else {
            return Promise.reject(new Error(`Fetch error: ${resp.statusText}`));
        }
    }).then((resp) => {
        $.create(resp).each((html) => {
            fastdom.write(() => {
                bonzo(el).html(html);
            });
        });
        relativeDates.init(el);
    }).catch((ex) => {
        reportError(ex, {
            feature: 'snaps',
        });
    });
}

function initStandardSnap(el) {
    proximityLoader.add(el, 1500, () => {
        fastdom.write(() => {
            bonzo(el).addClass('facia-snap-embed');
        });
        addCss(el);

        switch (el.getAttribute('data-snap-type')) {
            case 'document':
                injectIframe(el);
                break;

            case 'fragment':
                fetchFragment(el);
                break;

            case 'json.html':
                fetchFragment(el, true);
                break;
        }

        if (!detect.isIOS) {
            mediator.on('window:resize', debounce(() => {
                addCss(el, true);
            }, 200));
        }
    });
}

function initInlinedSnap(el) {
    addCss(el);
    if (!detect.isIOS) {
        mediator.on('window:resize', debounce(() => {
            addCss(el, true);
        }, 200));
    }
}

export default {
    init,
};
