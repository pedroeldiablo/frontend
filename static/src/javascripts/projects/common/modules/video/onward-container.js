import bean from 'bean';
import config from 'common/utils/config';
import Component from 'common/modules/component';
import mediator from 'common/utils/mediator';

function getEndpoint(mediaType) {
    const isInSeries = Boolean(config.page.seriesTags);

    if (isInSeries) {
        return `/video/in-series/${config.page.seriesId}.json`;
    } else {
        return `/${config.page.isPodcast ? 'podcast' : mediaType}/most-viewed.json`;
    }
}

function initEvents(el, manipulationType, endpoint) {
    bean.on(el, 'click', '.most-viewed-navigation__button', (ev) => {
        const page = ev.currentTarget.getAttribute('data-page');

        createComponent(el, endpoint, manipulationType, page);

        ev.preventDefault();
        return false;
    });
}

function createComponent(el, endpoint, manipulationType, page) {
    const component = new Component();
    const paginatedEndpoint = endpoint + (page ? `?page=${page}` : '');
    component.manipulationType = manipulationType;
    component.endpoint = paginatedEndpoint;

    el.innerHTML = ''; // we have no replace in component

    return component.fetch(el, 'html');
}

function init(el, mediaType) {
    const manipulationType = mediaType === 'video' ? 'append' : 'html';
    const endpoint = getEndpoint(mediaType);

    createComponent(el, endpoint, manipulationType).then(() => {
        mediator.emit('page:new-content');
        initEvents(el, manipulationType, endpoint);
    });
}

export default {
    init,
};
