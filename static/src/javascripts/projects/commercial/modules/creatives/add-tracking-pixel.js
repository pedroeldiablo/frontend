import template from 'common/utils/template';
import trackingPixelStr from 'text!commercial/views/creatives/tracking-pixel.html';
const trackingPixelTpl = template(trackingPixelStr);

function addTrackingPixel($adSlot, url) {
    $adSlot.before(trackingPixelTpl({
        url: encodeURI(url),
    }));
}

export default addTrackingPixel;
