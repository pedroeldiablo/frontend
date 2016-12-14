import addEventListener from 'common/utils/add-event-listener';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import lazyLoad from 'commercial/modules/dfp/lazy-load';
export default enableLazyLoad;

function enableLazyLoad() {
    if (!dfpEnv.lazyLoadEnabled) {
        dfpEnv.lazyLoadEnabled = true;
        addEventListener(window, 'scroll', lazyLoad, {
            passive: true,
        });
        lazyLoad();
    }
}
