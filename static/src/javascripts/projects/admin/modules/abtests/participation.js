/*
 Module: participation.js
 Description: Displays opt-in and opt-out links for a test
 */
import Component from 'common/modules/component';
import ParticipationItem from 'admin/modules/abtests/participation-item';
import assign from 'lodash/objects/assign';

function Participation(config) {
    this.config = assign(this.config, config);
}

Component.define(Participation);

Participation.prototype.config = {
    test: '',
};

Participation.prototype.templateName = 'participation-template';
Participation.prototype.componentClass = 'participation';
Participation.prototype.useBem = true;

Participation.prototype.prerender = function () {
    const test = this.config.test;
    const origin = /gutools.co.uk$/.test(document.location.origin) ? 'http://www.theguardian.com' : document.location.origin;
    const examplePath = `${test.examplePath || '/uk'}#ab-${test.id}`;

    this.getElem('opt-out').href = `${origin + examplePath}=notintest`;

    const linksContainer = this.getElem('links');

    test.variants.forEach((variant) => {
        new ParticipationItem({
            test: test.id,
            examplePath,
            variant: variant.id,
        }).render(linksContainer);
    });
};

export default Participation;
