import qwery from 'qwery';
import bonzo from 'bonzo';
import bean from 'bean';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import identity from 'common/modules/identity/api';
import svgs from 'common/views/svgs';
import saveLink from 'text!common/views/save-for-later/save-link.html';
import saveButton from 'text!common/views/save-for-later/save-button.html';
import bindAll from 'lodash/functions/bindAll';
import assign from 'lodash/objects/assign';
import forEach from 'lodash/collections/forEach';
import filter from 'lodash/collections/filter';
import some from 'lodash/collections/some';
import liveBlog from 'bootstraps/enhanced/liveblog';

function SaveForLater() {
    this.classes = {
        saveThisArticle: '.js-save-for-later',
        saveThisVideo: '.js-save-for-later-video',
        saveThisArticleButton: '.js-save-for-later__button',
        onwardContainer: '.js-onward',
        relatedContainer: '.js-related',
        showMoreContainer: '.js-show-more',
        itemMeta: '.js-item__meta',
        itemSaveLink: '.js-save-for-later-link',
        itemSaveLinkHeading: '.save-for-later-link__heading',
        fcItemIsSaved: 'fc-save-for-later--is-saved',
        profileDropdownLink: '.brand-bar__item--saved-for-later',
        identityProfileItem: '.js-profile-nav',
    };
    this.attributes = {
        containerItemShortUrl: 'data-loyalty-short-url',
        containerItemDataId: 'data-id',
    };


    this.isContent = !/Network Front|Section|Tag/.test(config.page.contentType);
    this.userData = {};

    bindAll(this,
        'save',
        'delete',
        'onSaveArticle',
        'onDeleteArticle',
        'createSaveFaciaItemHandler',
        'createDeleteFaciaItemHandler',
        'signUserInToSaveArticle'
    );
}

const bookmarkSvg = svgs('bookmark', ['rounded-icon']);
const shortUrl = config.page.shortUrlId || '';
const savedPlatformAnalytics = `web:${detect.getUserAgent.browser}:${detect.getBreakpoint()}`;

const getCustomEventProperties = (contentId) => {
    const prefix = config.page.contentType.match(/^Network Front|Section$/) ? 'Front' : 'Content';
    return {
        prop74: `${prefix}ContainerSave:${contentId}`,
    };
};

SaveForLater.prototype.conditionalInit = function () {
    if (!liveBlog.notificationsCondition()) {
        this.init();
    }
};

SaveForLater.prototype.init = function () {
    const userLoggedIn = identity.isUserLoggedIn();

    if (userLoggedIn) {
        identity.getSavedArticles()
            .then((resp) => {
                const notFound = {
                    message: 'Not found',
                    description: 'Resource not found',
                };

                if (resp.status === 'error' && resp.errors[0].message === notFound.message && resp.errors[0].description === notFound.description) {
                    // this user has never saved anything, so create a new
                    // data object and save an introductory article for them

                    // Identity api needs a string in the format yyyy-mm-ddThh:mm:ss+hh:mm  otherwise it barfs
                    const date = new Date().toISOString().replace(/\.[0-9]+Z/, '+00:00');
                    this.userData = {
                        version: date,
                        articles: [],
                    };
                    this.saveIntroArticle();
                } else {
                    this.userData = resp.savedArticles;
                }

                this.updateSavedCount();

                this.prepareFaciaItemLinks(true);

                if (this.isContent) {
                    this.renderSaveButtonsInArticle();
                }
            });
    } else if (this.isContent) {
        const url = template('<%= idUrl%>/save-content?INTCMP=DOTCOM_ARTICLE_SFL&returnUrl=<%= returnUrl%>&shortUrl=<%= shortUrl%>&platform=<%= platform%>', {
            idUrl: config.page.idUrl,
            returnUrl: encodeURIComponent(document.location.href),
            shortUrl,
            platform: savedPlatformAnalytics,
        });
        this.renderArticleSaveButton({
            url,
            isSaved: false,
        });
    }
};


SaveForLater.prototype.renderSaveButtonsInArticle = function () {
    if (this.getSavedArticle(shortUrl)) {
        this.renderArticleSaveButton({
            isSaved: true,
        });
    } else {
        this.renderArticleSaveButton({
            isSaved: false,
        });
    }
};

SaveForLater.prototype.renderArticleSaveButton = function (options) {
    const $savers = bonzo(qwery(this.classes.saveThisArticle));

    $savers.each((saver) => {
        const $saver = bonzo(saver);
        const templateData = {
            icon: bookmarkSvg,
            isSaved: options.isSaved,
            position: $saver.attr('data-position'),
            config,
        };
        fastdom.write(() => {
            $saver.css('display', 'block');
            if (options.url) {
                $saver.html(template(saveLink,
                    assign({
                        url: options.url,
                    }, templateData)));
            } else {
                $saver.html(template(saveButton, templateData));

                this.makeActive($saver[0], options);
            }
        });
    });
};

SaveForLater.prototype.makeActive = function (saver, options) {
    fastdom.write(() => {
        if (options.url) return saver.href = options.url;

        bean.one(saver, 'click', this.classes.saveThisArticleButton,
            this[options.isSaved ? 'deleteArticle' : 'saveArticle'].bind(this,
                config.page.pageId,
                shortUrl
            )
        );
    });
};

SaveForLater.prototype.getElementsIndexedById = function (context) {
    return qwery(`[${this.attributes.containerItemShortUrl}]`, context);
};

SaveForLater.prototype.prepareFaciaItemLinks = function (signedIn) {
    this.renderFaciaItemLinks(signedIn, document.body);

    mediator.once('modules:tonal:loaded', () => {
        this.renderFaciaItemLinks(signedIn, this.classes.onwardContainer);
    });

    mediator.once('modules:onward:loaded', () => {
        this.renderFaciaItemLinks(signedIn, this.classes.onwardContainer);
    });

    mediator.once('modules:tonal:loaded', () => {
        this.renderFaciaItemLinks(signedIn, this.classes.onwardContainer);
    });

    mediator.once('modules:related:loaded', () => {
        this.renderFaciaItemLinks(signedIn, this.classes.relatedContainer);
    });

    mediator.on('modules:show-more:loaded', () => {
        this.renderFaciaItemLinks(signedIn, this.classes.showMoreContainer);
        $(this.classes.showMoreContainer).removeClass('js-show-more');
    });
};

// Configure the save for later links on a front or in a container
SaveForLater.prototype.renderFaciaItemLinks = function (signedIn, context) {
    const elements = this.getElementsIndexedById(context);

    forEach(elements, (item) => {
        const $item = $(item);
        const $itemSaveLink = $(this.classes.itemSaveLink, item);
        const shortUrl = item.getAttribute(this.attributes.containerItemShortUrl);
        const id = item.getAttribute(this.attributes.containerItemDataId);
        const isSaved = signedIn ? this.getSavedArticle(shortUrl) : false;

        if ($itemSaveLink.length === 0) {
            return;
        }

        if (signedIn) {
            this[isSaved ? 'createDeleteFaciaItemHandler' : 'createSaveFaciaItemHandler']($itemSaveLink[0], id, shortUrl);
        } else {
            bean.one($itemSaveLink[0], 'click', (id, shortUrl) => {
                this.signUserInToSaveArticle(id, shortUrl);
            });
        }


        fastdom.write(() => {
            if (isSaved) {
                $itemSaveLink.addClass(this.classes.fcItemIsSaved);
            } else {
                const contentId = $($.ancestor($itemSaveLink[0], 'fc-item')).attr('data-id');
                $itemSaveLink.attr('data-custom-event-properties', JSON.stringify(getCustomEventProperties(contentId)));
            }
            $itemSaveLink.attr('data-link-name', isSaved ? 'Unsave' : 'Save');

            // only while in test
            $item.addClass('fc-item--has-metadata');
            $itemSaveLink.removeClass('is-hidden');
        });
    });
};

// generic functions to save/delete an article, from anywhere
SaveForLater.prototype.save = function (pageId, shortUrl, onSave) {
    const date = new Date().toISOString().replace(/\.[0-9]+Z/, '+00:00');

    const newArticle = {
        id: pageId,
        shortUrl,
        date,
        read: false,
        platform: savedPlatformAnalytics,
    };

    this.userData.articles.push(newArticle);

    identity.saveToArticles(this.userData).then(
        (resp) => {
            onSave(resp.status !== 'error');
        }
    );
};

SaveForLater.prototype.delete = function (pageId, shortUrl, onDelete) {
    this.userData.articles = filter(this.userData.articles, article => article.shortUrl !== shortUrl);

    identity.saveToArticles(this.userData).then(
        (resp) => {
            onDelete(resp.status !== 'error');
        }
    );
};

// handle saving/deleting from content pages
SaveForLater.prototype.saveArticle = function (pageId, shortUrl) {
    this.save(pageId, shortUrl, this.onSaveArticle);
};

SaveForLater.prototype.onSaveArticle = function (success) {
    this.renderArticleSaveButton({
        isSaved: success,
    });
    if (success) {
        this.updateSavedCount();
    }
};

SaveForLater.prototype.deleteArticle = function (pageId, shortUrl) {
    this.delete(pageId, shortUrl, this.onDeleteArticle);
};

SaveForLater.prototype.onDeleteArticle = function (success) {
    this.renderArticleSaveButton({
        isSaved: !success,
    });
    if (success) {
        this.updateSavedCount();
    }
};

// handle saving/deleting from fronts

SaveForLater.prototype.saveFaciaItem = function (pageId, shortUrl) {
    this.save(pageId, shortUrl, this.onSaveFaciaItem);
};

SaveForLater.prototype.onSaveFaciaItem = function (link, id, shortUrl, success) {
    const that = this;
    if (success) {
        this.createDeleteFaciaItemHandler(link, id, shortUrl);
        this.updateSavedCount();

        fastdom.write(() => {
            bonzo(link)
                .addClass(that.classes.fcItemIsSaved)
                .attr('data-link-name', 'Unsave')
                .attr('data-custom-event-properties', '');
        });
    } else {
        this.createSaveFaciaItemHandler(link, id, shortUrl);

        fastdom.write(() => {
            bonzo(qwery(that.classes.itemSaveLinkHeading, link)[0]).html('Error Saving');
        });
    }
};

SaveForLater.prototype.deleteFaciaItem = function (pageId, shortUrl) {
    this.save(pageId, shortUrl, this.onDeleteFaciaItem);
};

SaveForLater.prototype.onDeleteFaciaItem = function (link, id, shortUrl, success) {
    const that = this;
    if (success) {
        this.createSaveFaciaItemHandler(link, id, shortUrl);
        this.updateSavedCount();

        fastdom.write(() => {
            const contentId = $($.ancestor(link, 'fc-item')).attr('data-id');
            bonzo(link)
                .removeClass(that.classes.fcItemIsSaved)
                .attr('data-link-name', 'Save')
                .attr('data-custom-event-properties', JSON.stringify(getCustomEventProperties(contentId)));
        });
    } else {
        this.createDeleteFaciaItemHandler(link, id, shortUrl);

        fastdom.write(() => {
            bonzo(qwery(that.classes.itemSaveLinkHeading, link)[0]).html('Error Removing');
        });
    }
};

// --Create container link click handlers
SaveForLater.prototype.createSaveFaciaItemHandler = function (link, id, shortUrl) {
    if (link) {
        bean.one(link, 'click',
            this.save.bind(this,
                id,
                shortUrl,
                this.onSaveFaciaItem.bind(this, link, id, shortUrl)
            )
        );
    }
};

SaveForLater.prototype.signUserInToSaveArticle = (id, shortUrl) => {
    const url = template('<%= idUrl%>/save-content?returnUrl=<%= returnUrl%>&shortUrl=<%= shortUrl%>&platform=<%= platform%>&articleId=<%= articleId %>&INTCMP=SFL-SO', {
        idUrl: config.page.idUrl,
        returnUrl: encodeURIComponent(document.location.href),
        shortUrl,
        platform: savedPlatformAnalytics,
        articleId: id,
    });
    window.location = url;
};

SaveForLater.prototype.createDeleteFaciaItemHandler = function (link, id, shortUrl) {
    bean.one(link, 'click',
        this.delete.bind(this,
            id,
            shortUrl,
            this.onDeleteFaciaItem.bind(this, link, id, shortUrl)
        )
    );
};

SaveForLater.prototype.getSavedArticle = function (shortUrl) {
    return some(this.userData.articles, article => article.shortUrl.indexOf(shortUrl) > -1);
};

SaveForLater.prototype.updateSavedCount = function () {
    const $saveForLaterEl = $(this.classes.profileDropdownLink);
    const $profileDropdownItem = $(this.classes.identityProfileItem);
    const count = (this.userData.articles) ? this.userData.articles.length : 0;

    if (count > 0) {
        $saveForLaterEl.attr('data-saved-content-count', count);
        $profileDropdownItem.addClass('has-saved-articles');
    } else {
        $saveForLaterEl.removeAttr('data-saved-content-count', count);
        $profileDropdownItem.removeClass('has-saved-articles');
    }
};

SaveForLater.prototype.saveIntroArticle = function () {
    const pageId = 'help/insideguardian/2015/jul/21/introducing-save-for-later';
    const shortUrl = '/p/4ab7x';

    this.saveArticle(pageId, shortUrl);
};

export default SaveForLater;
