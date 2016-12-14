import config from 'common/utils/config';
import $ from 'common/utils/$';
import cookies from 'common/utils/cookies';
import detect from 'common/utils/detect';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import userPrefs from 'common/modules/user-prefs';
import Message from 'common/modules/ui/message';
import mediator from 'common/utils/mediator';
/**
 * Rules:
 *
 * UK / INT edition readers only
 * Never seen the cookie message before
 * Show once only
 * Show only on FIRST page view
 * Persist close state
 */
function init() {
    const geoContinentCookie = cookies.get('GU_geo_continent');
    if (geoContinentCookie && geoContinentCookie.toUpperCase() === 'EU') {
        let EU_COOKIE_MSG = 'GU_EU_MSG',
            euMessageCookie = cookies.get(EU_COOKIE_MSG);
        if (!euMessageCookie || euMessageCookie != 'seen') {
            let link = 'https://www.theguardian.com/info/cookies',
                txt = `Welcome to the Guardian. This site uses cookies. Read <a href="${link}" class="cookie-message__link">our policy</a>.`,
                opts = {
                    important: true,
                },
                cookieLifeDays = 365,
                msg = new Message('cookies', opts);
            msg.show(txt);
            cookies.add(EU_COOKIE_MSG, 'seen', cookieLifeDays);
            return true;
        }
    }
    mediator.emit('modules:ui:cookiesBanner:notShown');
}

export default {
    init,
};
