import config from 'common/utils/config';
import Cookie from 'common/utils/cookies';
import detect from 'common/utils/detect';

function openForesee() {
    require(['js!foresee.js']);
}

function load() {
    const isNetworkFront = config.page.contentType === 'Network Front';
    const isProfilePage = config.page.contentType === 'userid';

    const // 0.8% mobile and 0.6% rest
    sampleRate = detect.isBreakpoint({
        max: 'mobile',
    }) ? 0.008 : 0.006;

    const sample = Math.random() <= sampleRate;
    const hasForcedOptIn = /forceForesee/.test(location.hash);

    // the Foresee code is large, we only want to load it in when necessary.
    if (!Cookie.get('GU_TEST') && !isNetworkFront && !isProfilePage && (window.openForeseeWhenReady || sample || hasForcedOptIn)) {
        openForesee();
    }

    if (window.guardian) {
        window.guardian.openForesee = openForesee;
    }
}

export default {
    load,
};
