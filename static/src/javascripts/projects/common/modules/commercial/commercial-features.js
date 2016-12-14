import location from 'common/utils/location';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import robust from 'common/utils/robust';
import userFeatures from 'common/modules/commercial/user-features';
import identityApi from 'common/modules/identity/api';
import userPrefs from 'common/modules/user-prefs';

// Having a constructor means we can easily re-instantiate the object in a test
function CommercialFeatures() {
    const self = this;

        // this is used for SpeedCurve tests
    const noadsUrl = location.getHash().match(/[#&]noads(&.*)?$/);

    const externalAdvertising =
            !noadsUrl &&
            !userPrefs.isOff('adverts');

    const sensitiveContent =
            config.page.shouldHideAdverts ||
            config.page.section === 'childrens-books-site';

    const isMinuteArticle = config.page.isMinuteArticle;

    const isArticle = config.page.contentType === 'Article';

    const isGallery = config.page.contentType == 'Gallery';

    const isLiveBlog = config.page.isLiveBlog;

    const isHosted = config.page.isHosted;

    const isMatchReport = config.hasTone('Match reports');

    const isIdentityPage =
            config.page.contentType === 'Identity' ||
            config.page.section === 'identity'; // needed for pages under profile.* subdomain

    const switches = config.switches;

    const isWidePage = detect.getBreakpoint() === 'wide';

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
        canDisplayMembershipEngagementBanner: detect.adblockInUse.then(adblockUsed => !adblockUsed && self.canReasonablyAskForMoney),
    };
}

try {
    config.commercial = config.commercial || {};
    config.commercial.featuresDebug = new CommercialFeatures();
} catch (error) {
    robust.log('cm-commercialFeatures', error);
}

export default config.commercial.featuresDebug;
