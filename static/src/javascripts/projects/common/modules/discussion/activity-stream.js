import bonzo from 'bonzo';
import bean from 'bean';
import $ from 'common/utils/$';
import url from 'common/utils/url';
import component from 'common/modules/component';
import discussionApi from 'common/modules/discussion/api';

function ActivityStream(opts) {
    this.setOptions(opts);
}
component.define(ActivityStream);
ActivityStream.prototype.endpoint = '/discussion/profile/:userId/:streamType.json?page=:page';
ActivityStream.prototype.componentClass = 'activity-stream';

ActivityStream.prototype.defaultOptions = {
    page: 1,
    streamType: 'discussions',
    userId: null,
};
ActivityStream.prototype.ready = function () {
    this.removeState('loading');
    this.on('click', '.js-disc-recommend-comment', this.recommendComment);
    $('.js-disc-recommend-comment').addClass('disc-comment__recommend--open');

    window.onpopstate = event => {
        if (url.hasHistorySupport) {
            this.applyState(event.state.resp.html, event.state.streamType);
        }
    };

    pagination(this);
};
ActivityStream.prototype.recommendComment = e => {
    const el = e.currentTarget;
    discussionApi.recommendComment(el.getAttribute('data-comment-id'));
    bonzo(el).addClass('disc-comment__recommend--active');
    $('.js-disc-recommend-count', el).each((countEl) => {
        countEl.innerHTML = parseInt(countEl.innerHTML, 10) + 1;
    });
};
ActivityStream.prototype.change = function (opts) {
    this.setOptions(opts);
    return this._fetch();
};
ActivityStream.prototype.fetched = function (resp) {
    this.applyState(resp.html, this.options.streamType);
    this.updateHistory(resp);
};
ActivityStream.prototype.applyState = function (html, streamType) {
    // update display
    const $el = bonzo(this.elem).empty();
    this.setState('loading');
    $.create(html).each((el) => {
        $el.html($(el).html()).attr({
            class: el.className,
        });
    });
    this.removeState('loading');

    const activeTab = $('.tabs__tab--selected');
    if (activeTab.data('stream-type') !== streamType) {
        selectTab(streamType === 'comments' ? 'discussions' : streamType);
    }

    // update opts
    this.options.streamType = streamType;
};
ActivityStream.prototype.updateHistory = function (resp) {
    const page = this.options.page;
    const pageParam = url.getUrlVars().page;
    const streamType = this.options.streamType !== 'discussions' ? `/${this.options.streamType}` : '';
    const qs = `/user/id/${this.options.userId}${streamType}?${url.constructQuery({
        page,
    })}`;
    const state = {
        resp,
        streamType: this.options.streamType,
    };
    const params = {
        querystring: qs,
        state,
    };

    if (typeof pageParam === 'undefined') { // If first load and without page param, add it and overwrite history
        url.replaceQueryString(params);
    } else {
        url.pushQueryString(params);
    }
};

function pagination(activityStream) {
    bean.on(activityStream.elem, 'click', '.js-activity-stream-page-change', (e) => {
        const page = e.currentTarget.getAttribute('data-page');
        e.preventDefault();

        activityStream.change({
            page,
        });
    });
}

function selectTab(streamType) {
    // Blur so that when pressing forward/back the focus is not retained on
    // the old tab Note, without the focus first, the blur doesn't seem to
    // work for some reason
    $('.js-activity-stream-change').focus().blur();

    $('.tabs__tab--selected').removeClass('tabs__tab--selected');
    bonzo($(`a[data-stream-type=${streamType}]`)).parent().addClass('tabs__tab--selected');
}

export default ActivityStream;
