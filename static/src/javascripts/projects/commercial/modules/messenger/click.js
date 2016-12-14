import closest from 'common/utils/closest';
import google from 'common/modules/analytics/google';
import messenger from 'commercial/modules/messenger';
messenger.register('click', (linkName, ret, iframe) => sendClick(closest(iframe, '.js-ad-slot') || {
    id: 'unknown',
}, linkName));

export default sendClick;

function sendClick(adSlot, linkName) {
    google.trackNativeAdLinkClick(adSlot.id, linkName);
}
