import config from 'common/utils/config';
// The Nielsen NetRatings tag. Also known as IMR worldwide.

const imrWorldwideUrl = '//secure-au.imrworldwide.com/v60.js';

function onLoad() {
    const pvar = {
        cid: 'au-guardian',
        content: '0',
        server: 'secure-au',
    };
    // nol_t is a global function set by the imrworldwide library
    /* eslint-disable no-undef*/
    const trac = nol_t(pvar);
    trac.record().post();
}

export default {
    shouldRun: config.switches.imrWorldwide,
    url: imrWorldwideUrl,
    onLoad,
};
