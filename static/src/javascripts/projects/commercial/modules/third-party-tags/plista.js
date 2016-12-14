import Promise from 'Promise';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import template from 'common/utils/template';
import identity from 'common/modules/identity/api';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import plistaStr from 'text!commercial/views/plista.html';

const plistaTpl = template(plistaStr);
const selectors = {
    container: '.js-plista-container',
};

function loadInstantly() {
    return !document.getElementById('dfp-ad--merchandising-high') ||
        detect.adblockInUseSync();
}

function identityPolicy() {
    return !(identity.isUserLoggedIn() && config.page.commentable);
}

function shouldServe() {
    return commercialFeatures.outbrain &&
        !config.page.isFront &&
        !config.page.isPreview &&
        identityPolicy();
}

// a modification of the code provided by Plista; altered to be a lazy load rather than during DOM construction
function embed(publickey, widgetName, geo, u, categories) {
    const name = `PLISTA_${publickey}`;
    const lib = window[name];
    const $container = $(selectors.container);

    $container.append(plistaTpl({
        widgetName,
    }));
    $container.css('display', 'block');

    if (!lib || !lib.publickey) {
        window[name] = {
            publickey,
            widgets: [{
                name: widgetName,
                pre: u,
            }],
            geo,
            categories,
            dataMode: 'data-display',
        };
        require([`js!//static-au.plista.com/async/${name}.js`]);
    } else {
        lib.widgets.push({
            name: widgetName,
            pre: u,
        });
    }
}

function load() {
    fastdom.write(() => {
        embed(config.page.plistaPublicApiKey, 'innerArticle', 'au');
    });
}

const module = {
    load,
    init,
};

function init() {
    if (shouldServe()) {
        if (loadInstantly()) {
            module.load();
            return Promise.resolve(true);
        } else {
            return trackAdRender('dfp-ad--merchandising-high').then((isLoaded) => {
                if (!isLoaded) {
                    module.load();
                }
            });
        }
    }
}

export default module;
