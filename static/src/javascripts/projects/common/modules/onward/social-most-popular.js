import Component from 'common/modules/component';
import mediator from 'common/utils/mediator';

function SocialMostPopular(context, socialContext) {
    this.context = context;
    this.endpoint = '/most-read-' + socialContext + '.json';
    this.fetch(this.context, 'html');
}

Component.define(SocialMostPopular);

SocialMostPopular.prototype.ready = function(elem) {
    mediator.emit('page:new-content', elem);
};

export default SocialMostPopular;
