import bean from 'bean';
import mediator from 'common/utils/mediator';
import ab from 'common/modules/experiments/ab';
import merge from 'lodash/objects/merge';
import map from 'lodash/collections/map';

const Clickstream = (opts) => {
    opts = opts || {};

    // Allow a fake window.location to be passed in for testing
    const location = opts.location || window.location;

    const filters = opts.filter || [];
    const filterSource = element => filters.filter(f => (f === element));

    const compareHosts = (url) => {
        let urlHost;
        let host;

        url = url || '';
        urlHost = url.match(/:\/\/(.[^\/]+)/);

        if (urlHost) {
            urlHost = urlHost[1];
            host = location.hostname;
        }

        if (url.indexOf('mailto:') === 0) {
            return false;
        }

        // Lack of a urlHost implies a relative url.
        // For absolute urls we are protocol-agnostic,
        // e.g. we should treat https://gu.com/foo -> http://gu.com/bar as a same-host link.
        return !urlHost || urlHost === host;
    };

    const getClickSpec = (spec, forceValid) => {
        // element was removed from the DOM
        if (!spec.el) {
            return false;
        }
        const el = spec.el;
        const elName = el.tagName.toLowerCase();
        const dataLinkName = el.getAttribute('data-link-name');
        let href;

        if (dataLinkName) {
            spec.tag.unshift(dataLinkName);
        }

        if (elName === 'body') {
            spec.tag = spec.tag.join(' | ');
            delete spec.el;

            if (spec.validTarget && el.getAttribute('data-link-test')) {
                spec.tag = `${el.getAttribute('data-link-test')} | ${spec.tag}`;
            }
            return spec;
        }

        const customEventProperties = JSON.parse(el.getAttribute('data-custom-event-properties') || '{}');
        spec.customEventProperties = merge(customEventProperties, spec.customEventProperties);

        if (!spec.validTarget) {
            spec.validTarget = filterSource(elName).length > 0 || !!forceValid;
            if (spec.validTarget) {
                spec.target = el;
                href = el.getAttribute('href');
                spec.samePage = href && href.indexOf('#') === 0 || elName === 'button' || el.hasAttribute('data-is-ajax');

                spec.sameHost = spec.samePage || compareHosts(href);
            }
        }

        // Pick up the nearest data-link-context
        if (!spec.linkContext && el.getAttribute('data-link-context-path')) {
            spec.linkContextPath = el.getAttribute('data-link-context-path');
            spec.linkContextName = el.getAttribute('data-link-context-name');
        }

        // Recurse
        spec.el = el.parentNode;
        return getClickSpec(spec);
    };

    // delegate, emit the derived tag
    if (opts.addListener !== false) {
        bean.add(document.body, 'click', (event) => {
            let applicableTests;

            let clickSpec = {
                el: event.target,
                tag: [],
            };

            clickSpec.target = event.target;

            clickSpec = getClickSpec(clickSpec);

            // prefix ab tests to the click spec
            applicableTests = ab.getActiveTestsEventIsApplicableTo(clickSpec);
            if (applicableTests !== undefined && applicableTests.length > 0) {
                clickSpec.tag = map(applicableTests, (test) => {
                    const variant = ab.getTestVariantId(test);
                    return `AB,${test},${variant},${clickSpec.tag}`;
                }).join(',');
            }

            mediator.emit('module:clickstream:click', clickSpec);
        });
    }

    return {
        getClickSpec,
    };
};

export default Clickstream;
