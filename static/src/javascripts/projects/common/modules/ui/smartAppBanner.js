import fastdom from 'fastdom';
import $ from 'common/utils/$';
import cookies from 'common/utils/cookies';
import detect from 'common/utils/detect';
import storage from 'common/utils/storage';
import template from 'common/utils/template';
import loadCssPromise from 'common/utils/load-css-promise';
import userPrefs from 'common/modules/user-prefs';
import Message from 'common/modules/ui/message';
import config from 'common/utils/config';
/**
 * Rules:
 *
 * 4 visits within the last month
 * Less than 4 impressions
 * Persist close state
 */
let COOKIE_IMPRESSION_KEY = 'GU_SMARTAPPBANNER',
    DATA = {
        IOS: {
            LOGO: 'https://assets.guim.co.uk/images/apps/ios-logo.png',
            SCREENSHOTS: 'https://assets.guim.co.uk/images/apps/ios-screenshots.jpg',
            LINK: 'https://app.adjust.com/w97upi?deep_link=gnmguardian://root?contenttype=front&source=adjust',
            STORE: 'on the App Store',
        },
        ANDROID: {
            LOGO: 'https://assets.guim.co.uk/images/apps/android-logo-2x.png',
            SCREENSHOTS: 'https://assets.guim.co.uk/images/apps/ios-screenshots.jpg',
            LINK: 'https://app.adjust.com/642i3r?deep_link=x-gu://www.theguardian.com/?source=adjust',
            STORE: 'in Google Play',
        },
    },
    cookieVal = cookies.get(COOKIE_IMPRESSION_KEY),
    impressions = cookieVal && !isNaN(cookieVal) ? parseInt(cookieVal, 10) : 0,
    tmp = '<img src="<%=LOGO%>" class="app__logo" alt="Guardian App logo" /><div class="app__cta"><h4 class="app__heading">The Guardian app</h4>' +
    '<p class="app__copy">Instant alerts. Offline reading.<br/>Tailored to you.</p>' +
    '<p class="app__copy"><strong>FREE</strong> – <%=STORE%></p></div><a href="<%=LINK%>" class="app__link">View</a>',
    tablet = '<img src="<%=SCREENSHOTS%>" class="app__screenshots" alt="screenshots" />';

function isDevice() {
    return ((detect.isIOS() || detect.isAndroid()) && !detect.isFireFoxOSApp());
}

function canShow() {
    return impressions < 4;
}

function canUseSmartBanner() {
    return config.switches.smartAppBanner && detect.getUserAgent.browser === 'Safari' && detect.isIOS();
}

function showMessage() {
    loadCssPromise.then(() => {
        let platform = (detect.isIOS()) ? 'ios' : 'android',
            msg = new Message(platform),
            fullTemplate = tmp + (detect.getBreakpoint() === 'mobile' ? '' : tablet);

        msg.show(template(fullTemplate, DATA[platform.toUpperCase()]));

        cookies.add(COOKIE_IMPRESSION_KEY, impressions + 1);

        fastdom.read(() => {
            const $banner = $('.site-message--ios, .site-message--android');
            const bannerHeight = $banner.dim().height;
            if (window.scrollY !== 0) {
                window.scrollTo(window.scrollX, window.scrollY + bannerHeight);
            }
        });
    });
}

function init() {
    if (!canUseSmartBanner() && isDevice() && canShow()) {
        showMessage();
    }
}

function isMessageShown() {
    return ($('.site-message--android').css('display') === 'block' || $('.site-message--ios').css('display') === 'block');
}

function getMessageHeight() {
    return ($('.site-message--android').dim().height || $('.site-message--ios').dim().height);
}

export default {
    init,
    isMessageShown,
    getMessageHeight,
};
