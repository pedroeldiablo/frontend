/* global console */
// Include any images needed in templates here.
// This file is only required by core, and so has a long cache time.

import commentCount16icon from 'inlineSvg!svgs/icon/comment-16';
import marque36icon from 'inlineSvg!svgs/icon/marque-36';
import marque54icon from 'inlineSvg!svgs/icon/marque-54';
import marketDownIcon from 'inlineSvg!svgs/icon/market-down';
import marketUpIcon from 'inlineSvg!svgs/icon/market-up';
import marketSameIcon from 'inlineSvg!svgs/icon/market-same';
import arrowicon from 'inlineSvg!svgs/icon/arrow';
import arrowdownicon from 'inlineSvg!svgs/icon/arrow-down';
import crossIcon from 'inlineSvg!svgs/icon/cross';
import quoteIcon from 'inlineSvg!svgs/icon/quote';
import logoguardian from 'inlineSvg!svgs/logo/logo-guardian';
import logosoulmates from 'inlineSvg!svgs/commercial/logo-soulmates';
import logosoulmatesjoin from 'inlineSvg!svgs/commercial/soulmates-join';
import logojobs from 'inlineSvg!svgs/commercial/logo-jobs';
import logomasterclasses from 'inlineSvg!svgs/commercial/logo-masterclasses';
import logomasterclasseshorizontal from 'inlineSvg!svgs/commercial/logo-masterclasses-horizontal';
import logomembershiphorizontal from 'inlineSvg!svgs/commercial/logo-membership-horizontal';
import logojobshorizontal from 'inlineSvg!svgs/commercial/logo-jobs-horizontal';
import logobookshophorizontal from 'inlineSvg!svgs/commercial/logo-bookshop-horizontal';
import iconClock from 'inlineSvg!svgs/commercial/icon-clock';
import iconLocation from 'inlineSvg!svgs/commercial/icon-location';
import iconBasket from 'inlineSvg!svgs/commercial/icon-basket';
import paidContent from 'inlineSvg!svgs/commercial/paid-content';
import closeCentralIcon from 'inlineSvg!svgs/icon/close-central';
import arrowWhiteRight from 'inlineSvg!svgs/icon/arrow-white-right';
import arrowRight from 'inlineSvg!svgs/icon/arrow-right';
import bookmark from 'inlineSvg!svgs/icon/bookmark';
import dropdownMask from 'inlineSvg!svgs/icon/dropdown-mask';
import commentAnchor from 'inlineSvg!svgs/icon/comment-anchor';
import reply from 'inlineSvg!svgs/icon/reply';
import expandImage from 'inlineSvg!svgs/icon/expand-image';
import cursor from 'inlineSvg!svgs/icon/cursor';
import plus from 'inlineSvg!svgs/icon/plus';
import share from 'inlineSvg!svgs/icon/share';
import shareTwitter from 'inlineSvg!svgs/icon/share-twitter';
import shareEmail from 'inlineSvg!svgs/icon/share-email';
import shareFacebook from 'inlineSvg!svgs/icon/share-facebook';
import sharePinterest from 'inlineSvg!svgs/icon/share-pinterest';
import shareGPlus from 'inlineSvg!svgs/icon/share-gplus';
import externalLink from 'inlineSvg!svgs/icon/external-link';
import tick from 'inlineSvg!svgs/icon/tick';
import notificationsOff from 'inlineSvg!svgs/icon/notification-off';
import notificationsOn from 'inlineSvg!svgs/icon/notification-on';
import glabsLogoSmall from 'inlineSvg!svgs/logo/glabs-logo-small';
import membershipLogoWhite from 'inlineSvg!svgs/logo/membership-logo';
import membershipLogo from 'inlineSvg!svgs/commercial/logo-membership';
import adblockCoins from 'inlineSvg!svgs/commercial/adblock-coins';
import notificationsExplainerDesktop from 'inlineSvg!svgs/notifications-explainer-desktop';
import notificationsExplainerMobile from 'inlineSvg!svgs/notifications-explainer-mobile';
import adblockCoinsUS from 'inlineSvg!svgs/commercial/adblock-coins-us';
import star from 'inlineSvg!svgs/icon/star';
import svg from 'common/views/svg';
const svgs = {
    commentCount16icon,
    marque36icon,
    marque54icon,
    marketDownIcon,
    marketUpIcon,
    marketSameIcon,
    arrowicon,
    arrowdownicon,
    crossIcon,
    quoteIcon,
    logoguardian,
    logosoulmates,
    logosoulmatesjoin,
    logojobs,
    logomasterclasses,
    logomasterclasseshorizontal,
    logomembershiphorizontal,
    logojobshorizontal,
    logobookshophorizontal,
    iconClock,
    iconLocation,
    iconBasket,
    paidContent,
    closeCentralIcon,
    arrowWhiteRight,
    arrowRight,
    bookmark,
    dropdownMask,
    commentAnchor,
    reply,
    expandImage,
    cursor,
    plus,
    share,
    shareTwitter,
    shareEmail,
    shareFacebook,
    sharePinterest,
    shareGPlus,
    externalLink,
    tick,
    notificationsOff,
    notificationsOn,
    glabsLogoSmall,
    adblockCoinsUk: adblockCoins,
    adblockCoinsUs: adblockCoinsUS,
    logomembership: membershipLogo,
    notificationsExplainerDesktop,
    notificationsExplainerMobile,
    star,
    logomembershipwhite: membershipLogoWhite,
};

export default function (name, classes, title) {
    return svg(svgs[name], classes, title);
}
