import cookies from 'common/utils/cookies';
const MULTIVARIATE_ID_COOKIE = 'GU_mvt_id';
const VISITOR_ID_COOKIE = 's_vi';
const BROWSER_ID_COOKIE = 'bwid';

const // The full mvt ID interval is [1, 1000000]
MAX_CLIENT_MVT_ID = 1000000;

function overwriteMvtCookie(testId) {
    // For test purposes only.
    cookies.add(MULTIVARIATE_ID_COOKIE, testId, 365);
}

function getMvtFullId() {
    let bwidCookie = cookies.get(BROWSER_ID_COOKIE);
    let mvtidCookie = getMvtValue();
    let visitoridCookie = cookies.get(VISITOR_ID_COOKIE);

    if (!visitoridCookie) {
        visitoridCookie = 'unknown-visitor-id';
    }

    if (!bwidCookie) {
        bwidCookie = 'unknown-browser-id';
    }

    if (!mvtidCookie) {
        mvtidCookie = 'unknown-mvt-id';
    }

    return `${visitoridCookie} ${bwidCookie} ${mvtidCookie}`;
}

function getMvtValue() {
    return cookies.get(MULTIVARIATE_ID_COOKIE);
}

function getMvtNumValues() {
    return MAX_CLIENT_MVT_ID;
}

export default {
    getMvtFullId,
    getMvtValue,
    getMvtNumValues,
    overwriteMvtCookie,
    MAX_CLIENT_MVT_ID,
};
