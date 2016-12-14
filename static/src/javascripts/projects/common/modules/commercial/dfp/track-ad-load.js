import waitForAdvert from 'commercial/modules/dfp/wait-for-advert';
export default trackAdLoad;

function trackAdLoad(id) {
    return waitForAdvert(id).then(_ => _.whenLoaded);
}
