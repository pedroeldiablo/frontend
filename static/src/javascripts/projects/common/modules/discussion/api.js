import prefs from 'common/modules/user-prefs';
import ajax from 'common/utils/ajax';
import config from 'common/utils/config';

/**
 * Singleton to deal with Discussion API requests
 * @type {Object}
 */
const root = config.page.discussionApiUrl;

const Api = {
    root,
    clientHeader: config.page.discussionApiClientHeader,
    d2Uid: config.page.discussionD2Uid,
};

/**
 * @param {string} endpoint
 * @param {string} method
 * @param {Object.<string.*>} data
 * @return {Reqwest} a promise
 */
Api.send = (endpoint, method, data) => {
    data = data || {};

    const request = ajax({
        url: Api.root + endpoint,
        type: (method === 'get') ? 'jsonp' : 'json',
        method,
        crossOrigin: true,
        data,
        headers: {
            'D2-X-UID': Api.d2Uid,
            'GU-Client': Api.clientHeader,
        },
        withCredentials: true,
    });

    return request;
};

/**
 * @param {string} discussionId
 * @param {Object.<string.*>} comment
 * @return {Reqwest} a promise
 */
Api.postComment = (discussionId, comment) => {
    const endpoint = `/discussion/${discussionId}/comment${
        comment.replyTo ? `/${comment.replyTo.commentId}/reply` : ''}`;

    return Api.send(endpoint, 'post', comment);
};

/**
 * @param {string} comment
 * @return {Reqwest} a promise
 */
Api.previewComment = (comment) => {
    const endpoint = '/comment/preview';
    return Api.send(endpoint, 'post', comment);
};

/**
 * @param {number} id the comment ID
 * @return {Reqwest} a promise
 */
Api.recommendComment = (id) => {
    const endpoint = `/comment/${id}/recommend`;
    return Api.send(endpoint, 'post');
};

/**
 * @param {number} id the comment ID
 * @return {Reqwest} a promise
 */
Api.pickComment = (id) => {
    const endpoint = `/comment/${id}/highlight`;
    return Api.send(endpoint, 'post');
};

/**
 * @param {number} id the comment ID
 * @return {Reqwest} a promise
 */
Api.unPickComment = (id) => {
    const endpoint = `/comment/${id}/unhighlight`;
    return Api.send(endpoint, 'post');
};

/**
 * @param {number} id the comment ID
 * @param {Object.<string.string>} report the report info in the form of:
          { reason: string, emailAddress: string, categoryId: number }
 * @return {Reqwest} a promise
 */
Api.reportComment = (id, report) => {
    const endpoint = `/comment/${id}/reportAbuse`;
    return Api.send(endpoint, 'post', report);
};

/**
 * The id here is optional, but you shoudl try to specify it
 * If it isn't we use profile/me, which isn't as cachable
 * @param {number=} id (optional)
 */
Api.getUser = (id) => {
    const endpoint = `/profile/${!id ? 'me' : id}`;
    return Api.send(endpoint, 'get');
};

export default Api;
