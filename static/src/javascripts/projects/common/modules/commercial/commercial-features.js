import location from 'common/utils/location';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import robust from 'common/utils/robust';
import userFeatures from 'common/modules/commercial/user-features';
import identityApi from 'common/modules/identity/api';
import userPrefs from 'common/modules/user-prefs';
// Having a constructor means we can easily re-instantiate the object in a test
function CommercialFeatures() {
    var self = this;

    // this is used for SpeedCurve tests
    var noadsUrl = location.getHash().match(/[#&]noads(&.*)?$/);

    var externalAdvertising = !noadsUrl &&
        !userPrefs.isOff('adverts');

    var sensitiveContent =
        config.page.shouldHideAdverts ||
        config.page.section === 'childrens-books-site';

    var isMinuteArticle = config.page.isMinuteArticle;

    var isArticle = config.page.contentType === 'Article';

    var isGallery = config.page.contentType == 'Gallery';

    var isLiveBlog = config.page.isLiveBlog;

    var isHosted = config.page.isHosted;

    var isMatchReport = config.hasTone('Match reports');

    var isIdentityPage =
        config.page.contentType === 'Identity' ||
        config.page.section === 'identity'; // needed for pages under profile.* subdomain

    var switches = config.switches;

    var isWidePage = detect.getBreakpoint() === 'wide';

    // Feature switches

    this.dfpAdvertising =
        externalAdvertising &&
        !sensitiveContent;

    this.topBannerAd =
        this.dfpAdvertising &&
        !isMinuteArticle;

    this.galleryAdverts =
        this.dfpAdvertising &&
        isGallery;

    this.articleBodyAdverts =
        this.dfpAdvertising &&
        !isMinuteArticle &&
        isArticle &&
        !isLiveBlog &&
        !isHosted &&
        switches.commercial;

    this.articleAsideAdverts =
        this.dfpAdvertising &&
        !isMinuteArticle &&
        !isMatchReport &&
        !!(isArticle || isLiveBlog) &&
        switches.commercial;

    this.sliceAdverts =
        this.dfpAdvertising &&
        config.page.isFront &&
        switches.commercial;

    this.popularContentMPU =
        this.dfpAdvertising &&
        !isMinuteArticle;

    this.videoPreRolls =
        externalAdvertising &&
        !sensitiveContent &&
        switches.commercial;

    this.frontCommercialComponents =
        this.dfpAdvertising &&
        !isMinuteArticle &&
        config.page.isFront &&
        switches.commercial;

    this.thirdPartyTags =
        externalAdvertising &&
        !isIdentityPage;

    this.outbrain =
        externalAdvertising &&
        !sensitiveContent &&
        switches.outbrain &&
        config.page.showRelatedContent;

    this.commentAdverts =
        this.dfpAdvertising &&
        switches.commercial &&
        !isMinuteArticle &&
        config.switches.discussion &&
        config.page.commentable &&
        identityApi.isUserLoggedIn() &&
        (!isLiveBlog || isWidePage);

    this.liveblogAdverts =
        isLiveBlog &&
        this.dfpAdvertising &&
        switches.commercial;

    this.canReasonablyAskForMoney = // eg become a supporter, give a contribution
        !(userFeatures.isPayingMember() || config.page.shouldHideAdverts || config.page.isAdvertisementFeature);

    this.async = {
        canDisplayMembershipEngagementBanner: detect.adblockInUse.then(function(adblockUsed) {
            return !adblockUsed && self.canReasonablyAskForMoney;
        })
    };
}

try {
    config.commercial = config.commercial || {};
    return config.commercial.featuresDebug = new CommercialFeatures();
} catch (error) {
    robust.log('cm-commercialFeatures', error);
}
