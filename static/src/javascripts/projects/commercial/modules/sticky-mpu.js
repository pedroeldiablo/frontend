import config from 'common/utils/config';
import closest from 'common/utils/closest';
import mediator from 'common/utils/mediator';
import fastdom from 'common/utils/fastdom-promise';
import Sticky from 'common/modules/ui/sticky';
import messenger from 'commercial/modules/messenger';
import Promise from 'Promise';
let stickyElement = null;
let rightSlot;

function stickyMpu($adSlot) {
    if ($adSlot.data('name') !== 'right' || stickyElement) {
        return;
    }

    rightSlot = $adSlot[0];

    const referenceElement = document.querySelector(config.page.hasShowcaseMainElement ? '.media-primary' : '.content__article-body,.js-liveblog-body-content');
    if (!referenceElement) {
        return;
    }

    fastdom.read(() => (referenceElement[config.page.hasShowcaseMainElement ? 'offsetHeight' : 'offsetTop']) + $adSlot[0].offsetHeight).then(newHeight => fastdom.write(() => {
        $adSlot.parent().css('height', `${newHeight}px`);
    })).then(() => {
        // if there is a sticky 'paid by' band move the sticky mpu down so it will be always visible
        const options = config.page.isAdvertisementFeature ? {
            top: 43,
        } : {};
        stickyElement = new Sticky($adSlot[0], options);
        stickyElement.init();
        mediator.emit('page:commercial:sticky-mpu');
        messenger.register('resize', onResize);
        return stickyElement;
    });
}

function onResize(specs, _, iframe) {
    if (rightSlot.contains(iframe)) {
        messenger.unregister('resize', onResize);
        stickyElement.updatePosition();
    }
}

stickyMpu.whenRendered = new Promise((resolve) => {
    mediator.on('page:commercial:sticky-mpu', resolve);
});

export default stickyMpu;
