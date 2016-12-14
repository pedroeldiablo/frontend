import reqwest from 'reqwest';
import config from 'common/utils/config';
import raven from 'common/utils/raven';
// This should no longer be used.
// Prefer the new 'common/utils/fetch' or 'common/utils/fetch-json' library instead, which are es6 compliant.
let ajaxHost = config.page.ajaxUrl || '';

function ajax(params) {
    let r;

    if (!params.url.match('^(https?:)?//')) {
        params.url = ajaxHost + params.url;
        params.crossOrigin = true;
    }

    r = reqwest(params);
    raven.wrap({
        deep: true,
    }, r.then);
    return r;
}

ajax.setHost = host => {
    ajaxHost = host;
};

export default ajax;
