import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import Promise from 'Promise';
import $ from 'common/utils/$';
import raven from 'common/utils/raven';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import scroller from 'common/utils/scroller';
import fastdom from 'common/utils/fastdom-promise';
import fetchJson from 'common/utils/fetch-json';
import DiscussionAnalytics from 'common/modules/analytics/discussion';
import register from 'common/modules/analytics/register';
import Component from 'common/modules/component';
import DiscussionApi from 'common/modules/discussion/api';
import CommentBox from 'common/modules/discussion/comment-box';
import Comments from 'common/modules/discussion/comments';
import discussionFrontend from 'common/modules/discussion/discussion-frontend';
import upvote from 'common/modules/discussion/upvote';
import ab from 'common/modules/experiments/ab';
import Id from 'common/modules/identity/api';
import userPrefs from 'common/modules/user-prefs';
import isNumber from 'lodash/objects/isNumber';

const Loader = () => {
    register.begin('discussion');
};
Component.define(Loader);

Loader.prototype.classes = {};

Loader.prototype.componentClass = 'discussion';
Loader.prototype.comments = null;
Loader.prototype.user = null;

Loader.prototype.initTopComments = function () {
    this.on('click', '.js-jump-to-comment', function (e) {
        e.preventDefault();
        const commentId = bonzo(e.currentTarget).data('comment-id');
        this.gotoComment(commentId);
    });

    return fetchJson(`/discussion/top-comments/${this.getDiscussionId()}.json?commentable=${config.page.commentable}`, {
        mode: 'cors',
    }).then(
        (resp) => {
            this.$topCommentsContainer.html(resp.html);
            this.topCommentCount = qwery('.d-top-comment', this.$topCommentsContainer[0]).length;
            if (this.topCommentCount !== 0) {
                $('.js-discussion-comment-box--bottom').removeClass('discussion__comment-box--bottom--hidden');
                this.setState('has-top-comments');
            }
        }
    ).catch(this.logError.bind(this, 'Top comments'));
};

Loader.prototype.initMainComments = function () {
    let self = this;
    let commentId = this.getCommentIdFromHash();

    const order = userPrefs.get('discussion.order') || (this.getDiscussionClosed() ? 'oldest' : 'newest');
    const threading = userPrefs.get('discussion.threading') || 'collapsed';

    const defaultPagesize = detect.isBreakpoint({
        min: 'tablet',
    }) ? 25 : 10;

    this.comments = new Comments({
        discussionId: this.getDiscussionId(),
        order,
        pagesize: defaultPagesize,
        threading,
    });

    this.comments.attachTo(qwery('.js-discussion-main-comments')[0]);

    this.comments.on('untruncate-thread', this.removeTruncation.bind(this));

    this.on('click,', '.js-discussion-author-link', this.removeTruncation.bind(this));
    this.on('click', '.js-discussion-change-page, .js-discussion-show-button', () => {
        mediator.emit('discussion:comments:get-more-replies');
        self.removeTruncation();
    });


    this.comments.on('rendered', (paginationHtml) => {
        let newPagination = bonzo.create(paginationHtml);
        let toolbarEl = qwery('.js-discussion-toolbar', this.elem)[0];
        let container = $('.js-discussion-pagination', toolbarEl).empty();

        // When the pagesize is 'All', do not show any pagination.
        if (!this.comments.isAllPageSizeActive()) {
            container.html(newPagination);
        }
    });

    this.setState('loading');

    this.on('user:loaded', function () {
        this.initState();
        this.renderCommentBar();
        if (this.user) {
            this.comments.addUser(this.user);

            let userPageSize = userPrefs.get('discussion.pagesize');
            let pageSize = defaultPagesize;

            if (isNumber(userPageSize)) {
                pageSize = userPageSize;
            } else if (userPageSize === 'All') {
                pageSize = config.switches.discussionAllPageSize ? 'All' : 100;
            }
            this.initPageSizeDropdown(pageSize);

            if (config.switches.discussionPageSize && detect.isBreakpoint({
                min: 'tablet',
            })) {
                this.comments.options.pagesize = pageSize;
            }

            if (this.user.isStaff) {
                this.removeState('not-staff');
                this.setState('is-staff');
            }
        }

        // Only truncate the loaded comments on this initial fetch,
        // and when no comment ID or #comments location is present.
        const shouldTruncate = !commentId && window.location.hash !== '#comments';

        this.loadComments({
            comment: commentId,
            shouldTruncate,
        })
            .catch(this.logError.bind(this, 'Comments'));
    });
    this.getUser();
};

Loader.prototype.logError = function (commentType, error) {
    let reportMsg = `${commentType} failed to load: `;
    let request = error.request || {};
    if (error.message === 'Request is aborted: timeout') {
        reportMsg += 'XHR timeout';
    } else if (error.message) {
        reportMsg += error.message;
    } else {
        reportMsg += 'status' in request ? request.status : '';
    }
    raven.captureMessage(reportMsg, {
        tags: {
            contentType: 'comments',
            discussionId: this.getDiscussionId(),
            status: 'status' in request ? request.status : '',
            readyState: 'readyState' in request ? request.readyState : '',
            response: 'response' in request ? request.response : '',
            statusText: 'status' in request ? request.statusText : '',
        },
    });
};

Loader.prototype.initPageSizeDropdown = function (pageSize) {
    const $pagesizeLabel = $('.js-comment-pagesize');
    $pagesizeLabel.text(pageSize);
    this.on('click', '.js-comment-pagesize-dropdown .popup__action', function (e) {
        bean.fire(qwery('.js-comment-pagesize-dropdown [data-toggle]')[0], 'click');
        const selectedPageSize = bonzo(e.currentTarget).data('pagesize');
        this.comments.options.pagesize = selectedPageSize;
        $pagesizeLabel.text(selectedPageSize);
        userPrefs.set('discussion.pagesize', selectedPageSize);
        this.loadComments({
            page: 1,
        });
    });
};

Loader.prototype.initToolbar = function () {
    const $orderLabel = $('.js-comment-order');
    $orderLabel.text(this.comments.options.order);
    this.on('click', '.js-comment-order-dropdown .popup__action', function (e) {
        bean.fire(qwery('.js-comment-order-dropdown [data-toggle]')[0], 'click');
        this.comments.options.order = bonzo(e.currentTarget).data('order');
        $orderLabel.text(this.comments.options.order);
        userPrefs.set('discussion.order', this.comments.options.order);
        this.loadComments({
            page: 1,
        });
    });

    const $threadingLabel = $('.js-comment-threading');
    $threadingLabel.text(this.comments.options.threading);
    this.on('click', '.js-comment-threading-dropdown .popup__action', function (e) {
        bean.fire(qwery('.js-comment-threading-dropdown [data-toggle]')[0], 'click');
        this.comments.options.threading = bonzo(e.currentTarget).data('threading');
        $threadingLabel.text(this.comments.options.threading);
        userPrefs.set('discussion.threading', this.comments.options.threading);
        this.loadComments();
    });

    if (config.page.section === 'crosswords') {
        const $timestampsLabel = $('.js-timestamps');
        const updateLabelText = prefValue => {
            $timestampsLabel.text(prefValue ? 'Relative' : 'Absolute');
        };
        updateLabelText(undefined);

        const PREF_RELATIVE_TIMESTAMPS = 'discussion.enableRelativeTimestamps';
        // Default to true
        const prefValue = userPrefs.get(PREF_RELATIVE_TIMESTAMPS) !== null ? userPrefs.get(PREF_RELATIVE_TIMESTAMPS) : true;
        updateLabelText(prefValue);

        this.on('click', '.js-timestamps-dropdown .popup__action', function (e) {
            bean.fire(qwery('.js-timestamps-dropdown [data-toggle]')[0], 'click');
            const format = bonzo(e.currentTarget).data('timestamp');
            const prefValue = format === 'relative';
            updateLabelText(prefValue);
            userPrefs.set(PREF_RELATIVE_TIMESTAMPS, prefValue);
            this.loadComments();
        });
    }
};

Loader.prototype.initRecommend = function () {
    this.on('click', '.js-recommend-comment', function (e) {
        upvote.handle(e.currentTarget, this.elem, this.user, DiscussionApi, config.switches.discussionAllowAnonymousRecommendsSwitch);
    });
    this.on('click', '.js-rec-tooltip-close', () => {
        upvote.closeTooltip();
    });
};

Loader.prototype.ready = function () {
    this.$topCommentsContainer = $('.js-discussion-top-comments');

    this.initTopComments();
    this.initMainComments();
    this.initToolbar();
    this.renderCommentCount();
    this.initPagination();
    this.initRecommend();

    DiscussionAnalytics.init();

    // More for analytics than anything
    if (window.location.hash === '#comments') {
        mediator.emit('discussion:seen:comments-anchor');
    } else if (this.getCommentIdFromHash()) {
        mediator.emit('discussion:seen:comment-permalink');
    }

    mediator.on('discussion:commentbox:post:success', this.removeState.bind(this, 'empty'));

    mediator.on('module:clickstream:click', (clickspec) => {
        if (
            clickspec &&
            'hash' in clickspec.target &&
            clickspec.target.hash === '#comments'
        ) {
            this.removeTruncation();
        }
    });

    register.end('discussion');
};

Loader.prototype.getUser = function () {
    if (Id.getUserFromCookie()) {
        DiscussionApi.getUser().then((resp) => {
            this.user = resp.userProfile;
            this.emit('user:loaded');
        });
    } else {
        this.emit('user:loaded');
    }
};

Loader.prototype.isCommentable = function () {
    // not readonly, not closed and user is signed in
    const userCanPost = this.user && this.user.privateFields && this.user.privateFields.canPostComment;
    return userCanPost && !this.comments.isReadOnly() && !this.getDiscussionClosed();
};

Loader.prototype.initState = function () {
    if (this.getDiscussionClosed()) {
        this.setState('closed');
    } else if (this.comments.isReadOnly()) {
        this.setState('readonly');
    } else if (Id.getUserFromCookie()) {
        if (this.user && this.user.privateFields && !this.user.privateFields.canPostComment) {
            this.setState('banned');
        } else {
            this.setState('open');
        }
    } else {
        this.setState('open');
    }
};

Loader.prototype.renderCommentBar = function () {
    if (this.isCommentable()) {
        this.renderCommentBox(qwery('.js-discussion-comment-box--top')[0]);
        this.renderCommentBox(qwery('.js-discussion-comment-box--bottom')[0]);
    }
};

Loader.prototype.commentPosted = function(...args) {
    this.removeState('truncated');
    this.comments.addComment(...args);
};

Loader.prototype.renderCommentBox = function (elem) {
    return new CommentBox({
        discussionId: this.getDiscussionId(),
        premod: this.user.privateFields.isPremoderated,
        newCommenter: !this.user.privateFields.hasCommented,
        shouldRenderMainAvatar: false,
    }).render(elem).on('post:success', this.commentPosted.bind(this));
};

Loader.prototype.getDiscussionId = function () {
    return this.elem.getAttribute('data-discussion-key');
};

Loader.prototype.getDiscussionClosed = function () {
    return this.elem.getAttribute('data-discussion-closed') === 'true';
};

Loader.prototype.renderCommentCount = function () {
    if (window.curlConfig.paths['discussion-frontend-preact']) {
        return discussionFrontend.load(ab, this, {
            apiHost: config.page.discussionApiUrl,
            avatarImagesHost: config.page.avatarImagesUrl,
            closed: this.getDiscussionClosed(),
            discussionId: this.getDiscussionId(),
            element: document.getElementsByClassName('js-discussion-external-frontend')[0],
            userFromCookie: !!Id.getUserFromCookie(),
            profileUrl: config.page.idUrl,
            profileClientId: config.switches.registerWithPhone ? 'comments' : '',
            Promise,
        });
    } else {
        this.setState('empty');
    }
};

Loader.prototype.getCommentIdFromHash = () => {
    const reg = (/#comment-(\d+)/);
    return reg.exec(window.location.hash) ? parseInt(reg.exec(window.location.hash)[1], 10) : null;
};

Loader.prototype.setCommentHash = id => {
    window.location.replace(`#comment-${id}`);
};

Loader.prototype.initPagination = function () {
    this.on('click', '.js-discussion-change-page', function (e) {
        e.preventDefault();
        const page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
        this.setState('loading');
        this.gotoPage(page);
    });
};

Loader.prototype.gotoComment = function (id, fromRequest) {
    const comment = $(`#comment-${id}`, this.elem);
    const thisLoader = this;

    if (comment.length > 0) {
        const commentsAreHidden = $('.js-discussion-main-comments').css('display') === 'none';
        // If comments are hidden, lets show them
        if (commentsAreHidden) {
            fastdom.write(() => {
                thisLoader.comments.showHiddenComments();
                thisLoader.removeState('truncated');
                const $showAllButton = $('.d-discussion__show-all-comments');
                $showAllButton.length && $showAllButton.addClass('u-h');
            }).then(() => {
                thisLoader.setCommentHash(id);
            });
        } else {
            // If comments aren't hidden we can go straight to the comment
            thisLoader.setCommentHash(id);
        }
    } else if (!fromRequest) {
        // If the comment isn't on the page, then we need to load the comment thread
        thisLoader.loadComments({
            comment: id,
        });
    } else {
        // The comment didn't exist in the response

        // Scroll to toolbar and show message
        scroller.scrollToElement(qwery('.js-discussion-toolbar'), 100);
        fastdom.write(() => {
            $('.js-discussion-main-comments').prepend('<div class="d-discussion__message d-discussion__message--error">The comment you requested could not be found.</div>');
        });

        // Capture in sentry
        raven.captureMessage('Comment doesn\'t exist in response', {
            level: 'error',
            extra: {
                commentId: id,
            },
        });
    }
};

Loader.prototype.gotoPage = function (page) {
    scroller.scrollToElement(qwery('.js-discussion-toolbar'), 100);
    this.comments.relativeDates();
    this.loadComments({
        page,
    });
};

Loader.prototype.loadComments = function (options) {
    this.setState('loading');

    // If the caller specified truncation, do not load all comments.
    if (options && options.shouldTruncate && this.comments.isAllPageSizeActive()) {
        options.pageSize = 10;
    }

    return this.comments.fetchComments(options)
        .then(() => {
            this.removeState('loading');
            if (options && options.shouldTruncate) {
                this.setState('truncated');
            } else {
                // do not call removeTruncation because it could invoke another fetch.
                this.removeState('truncated');
            }
            if (this.comments.shouldShowPageSizeMessage()) {
                this.setState('pagesize-msg-show');
            } else {
                this.removeState('pagesize-msg-show');
            }
            if (options.comment) {
                this.gotoComment(options.comment, true);
            }
        });
};

Loader.prototype.removeTruncation = function () {
    // When the pagesize is 'All', the full page is not yet loaded, so load the comments.
    if (this.comments.isAllPageSizeActive()) {
        this.loadComments();
    } else {
        this.removeState('truncated');
    }
};

export default Loader; // define
