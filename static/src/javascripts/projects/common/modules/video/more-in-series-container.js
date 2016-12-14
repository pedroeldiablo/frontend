import Component from 'common/modules/component';
import mediator from 'common/utils/mediator';

function init(el, mediaType, section, shortUrl, series) {
    const component = new Component();
    const endpoint = `/${mediaType}/section/${section
        }${series ? `/${series}` : ''
        }.json?shortUrl=${shortUrl
        // exclude professional network content from video pages
        }${mediaType === 'video' ? '&exclude-tag=guardian-professional/guardian-professional' : ''}`;

    component.endpoint = endpoint;

    component.fetch(el).then(() => {
        mediator.emit('page:media:moreinloaded', el);
        mediator.emit('page:new-content', el);
    });
}

export default {
    init,
};
