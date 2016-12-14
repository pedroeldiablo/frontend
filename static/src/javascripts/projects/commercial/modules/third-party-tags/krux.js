import config from 'common/utils/config';
import cookies from 'common/utils/cookies';
import storage from 'common/utils/storage';
var kruxUrl = '//cdn.krxd.net/controltag?confid=JVZiE3vn';

function retrieve(n) {
    var k = 'kx' + n;

    return storage.local.getRaw(k) || cookies.get(k + '=([^;]*)') || '';
}

function getSegments() {
    return retrieve('segs') ? retrieve('segs').split(',') : [];
}

export default {
    shouldRun: !(config.page.contentType == 'Network Front') && config.switches.krux,
    url: kruxUrl,
    getSegments: getSegments
};
