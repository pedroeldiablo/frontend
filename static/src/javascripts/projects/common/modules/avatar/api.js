import ajax from 'common/utils/ajax';
import config from 'common/utils/config';

const apiUrl = `${config.page.avatarApiUrl}/v1`;
const staticUrl = `${config.page.avatarImagesUrl}/user`;
const Api = {};

Api.request = function (method, path, data) {
    const params = {
        url: apiUrl + path,
        type: 'json',
        data: data || {},
        processData: false,
        method,
        crossOrigin: true,
        withCredentials: true,
    };

    return ajax(params);
};

// A user's 'active' avatar is only available to signed-in users as it
// includes avatars in a pre-mod state.
Api.getActive = function () {
    return Api.request('GET', '/avatars/user/me/active');
};

Api.updateAvatar = function (data) {
    return Api.request('POST', '/avatars', data);
};

// The deterministic URL always returns an image. If the user has no avatar,
// a default image is returned.
Api.deterministicUrl = function (userId) {
    return `${staticUrl}/${userId}`;
};

export default Api;
