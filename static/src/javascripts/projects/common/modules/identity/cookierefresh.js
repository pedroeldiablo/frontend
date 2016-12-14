import Id from 'common/modules/identity/api';
import storage from 'common/utils/storage';

function CookieRefresh() {
    this.init = function () {
        if (storage.local.isStorageAvailable() && Id.isUserLoggedIn()) {
            let lastRefresh = storage.local.get(Id.lastRefreshKey),
                currentTime = new Date().getTime();
            if (this.shouldRefreshCookie(lastRefresh, currentTime)) {
                Id.getUserFromApiWithRefreshedCookie();
                storage.local.set(Id.lastRefreshKey, currentTime);
            }
        }
    };

    CookieRefresh.prototype.shouldRefreshCookie = function (lastRefresh, currentTime) {
        return (!lastRefresh) || (currentTime > (parseInt(lastRefresh, 10) + (1000 * 86400 * 30)));
    };
}
export default CookieRefresh;
