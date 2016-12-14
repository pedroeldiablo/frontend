import bonzo from 'bonzo';
import fastdom from 'fastdom';
export default emptyAdvert;

function emptyAdvert(advert) {
    fastdom.write(() => {
        window.googletag.destroySlots([advert.slot]);
        bonzo(advert.node).remove();
        advert.node = advert.slot = null;
    });
}
