import fastdom from 'common/utils/fastdom-promise';
import template from 'common/utils/template';
import detect from 'common/utils/detect';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';
import revealerStr from 'text!commercial/views/creatives/revealer.html';
let revealerTpl;

function Revealer($adSlot, params) {
    revealerTpl || (revealerTpl = template(revealerStr));

    return Object.freeze({
        create,
    });

    function create() {
        const markup = revealerTpl(params);

        return fastdom.write(() => {
            $adSlot[0].insertAdjacentHTML('beforeend', markup);
            $adSlot.addClass('ad-slot--revealer ad-slot--fabric content__mobile-full-width');
            if (params.trackingPixel) {
                addTrackingPixel($adSlot, params.trackingPixel + params.cacheBuster);
            }
        }).then(() => fastdom.read(() => detect.getViewport())).then(viewport => fastdom.write(() => {
            const background = $adSlot[0].getElementsByClassName('creative__background')[0];
                // for the height, we need to account for the height of the location bar, which
                // may or may not be there. 70px padding is not too much.
            background.style.height = `${viewport.height + 70}px`;
            return true;
        }));
    }
}

export default Revealer;
