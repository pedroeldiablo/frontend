import dfpEnv from 'commercial/modules/dfp/dfp-env';
import Advert from 'commercial/modules/dfp/Advert';
export default loadAdvert;

function loadAdvert(advert) {
    Advert.startLoading(advert);
    window.googletag.display(advert.id);
    dfpEnv.firstAdDisplayed = true;
}
