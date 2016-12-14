/**
 * A regionalised container for all the commercial tags.
 */
import Promise from 'Promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import fastdom from 'common/utils/fastdom-promise';
import template from 'common/utils/template';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import audienceScienceGateway from 'commercial/modules/third-party-tags/audience-science-gateway';
import audienceSciencePql from 'commercial/modules/third-party-tags/audience-science-pql';
import imrWorldwide from 'commercial/modules/third-party-tags/imr-worldwide';
import remarketing from 'commercial/modules/third-party-tags/remarketing';
import krux from 'commercial/modules/third-party-tags/krux';
import identity from 'common/modules/identity/api';
import outbrain from 'commercial/modules/third-party-tags/outbrain';
import plista from 'commercial/modules/third-party-tags/plista';
import externalContentContainerStr from 'text!common/views/commercial/external-content.html';

function loadExternalContentWidget() {
    const externalTpl = template(externalContentContainerStr);
    const documentAnchorClass = '.js-external-content-widget-anchor';

    function renderWidgetContainer(widgetType) {
        $(documentAnchorClass).append(externalTpl({
            widgetType,
        }));
    }

    const isMobileOrTablet = ['mobile', 'tablet'].indexOf(detect.getBreakpoint(false)) >= 0;
    const shouldIgnoreSwitch = isMobileOrTablet || config.page.section === 'world' || config.page.edition.toLowerCase() !== 'au';
    const shouldServePlista = config.switches.plistaForOutbrainAu && !shouldIgnoreSwitch;

    if (shouldServePlista) {
        fastdom.write(() => {
            renderWidgetContainer('plista');
        }).then(plista.init);
    } else {
        fastdom.write(() => {
            renderWidgetContainer('outbrain');
        }).then(outbrain.init);
    }
}

function init() {
    if (!commercialFeatures.thirdPartyTags) {
        return Promise.resolve(false);
    }

    // Outbrain/Plista needs to be loaded before first ad as it is checking for presence of high relevance component on page
    loadExternalContentWidget();

    loadOther();
    return Promise.resolve(true);
}

function loadOther() {
    const services = [
        audienceSciencePql,
        audienceScienceGateway,
        imrWorldwide,
        remarketing,
        krux,
    ].filter(_ => _.shouldRun);

    if (services.length) {
        insertScripts(services);
    }
}

function insertScripts(services) {
    const ref = document.scripts[0];
    const frag = document.createDocumentFragment();
    while (services.length) {
        const service = services.shift();
        const script = document.createElement('script');
        script.src = service.url;
        script.onload = service.onLoad;
        frag.appendChild(script);
    }
    ref.parentNode.insertBefore(frag, ref);
}

export default {
    init,
};
