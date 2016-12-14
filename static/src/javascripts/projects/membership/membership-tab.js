import bean from 'bean';
import $ from 'common/utils/$';
import ajax from 'common/utils/ajax';
import config from 'common/utils/config';
import formatters from 'membership/formatters';
import stripe from 'membership/stripe';

let CARD_DETAILS = '.js-mem-card-details';
let CHANGE_TIER_CARD_LAST4 = '.js-mem-card-last4';
let PACKAGE_COST = '.js-mem-package-cost';
let PACKAGE_CURRENT_RENEWAL_DATE = '.js-mem-current-renewal-date';
let PACKAGE_CURRENT_PERIOD_END = '.js-mem-current-period-end';
let PACKAGE_CURRENT_PERIOD_START = '.js-mem-current-period-start';
let PACKAGE_CURRENT_PERIOD_START_CONTAINER = '.js-mem-current-period-start-container';
let PACKAGE_NEXT_PAYMENT_CONTAINER = '.js-mem-next-payment-container';
let TRIAL_INFO_CONTAINER = '.js-mem-only-for-trials';
let PACKAGE_NEXT_PAYMENT_DATE = '.js-mem-next-payment-date';
let PACKAGE_NEXT_PAYMENT_PRICE = '.js-mem-next-payment-price';
let PACKAGE_INTERVAL = '.js-mem-plan-interval';
let DETAILS_MEMBERSHIP_TIER_ICON_CURRENT = '.js-mem-icon-current';
let DETAILS_JOIN_DATE = '.js-mem-join-date';
let DETAILS_MEMBER_NUM_TEXT = '.js-mem-number';
let NOTIFICATION_CANCEL = '.js-mem-cancel-tier';
let NOTIFICATION_CHANGE = '.js-mem-change-tier';
let MEMBER_DETAILS = '.js-mem-details';
let DETAILS_MEMBER_NUMBER_CONTAINER = '.js-mem-number-container';
let MEMBERSHIP_TIER = '.js-mem-tier';
let UP_SELL = '.js-mem-up-sell';
let MEMBER_INFO = '.js-mem-info';
let LOADER = '.js-mem-loader';
let IS_HIDDEN_CLASSNAME = 'is-hidden';

function fetchUserDetails() {
    ajax({
        url: `${config.page.userAttributesApiUrl}/me/mma-membership`,
        crossOrigin: true,
        withCredentials: true,
        method: 'get',
    }).then((resp) => {
        if (resp && resp.subscription) {
            hideLoader();
            populateUserDetails(resp);
        } else {
            hideLoader();
            displayMembershipUpSell();
        }
    });
}

function hideLoader() {
    $(LOADER).addClass(IS_HIDDEN_CLASSNAME);
}


function populateUserDetails(userDetails) {
    let isMonthly = userDetails.subscription.plan.interval === 'month';
    let intervalText = isMonthly ? 'Monthly' : 'Annual';
    let glyph = userDetails.subscription.plan.currency;
    let notificationTypeSelector;

    $(MEMBERSHIP_TIER).text(userDetails.tier);
    $(PACKAGE_COST).text(formatters.formatAmount(userDetails.subscription.plan.amount, glyph));
    $(DETAILS_JOIN_DATE).text(formatters.formatDate(userDetails.joinDate));
    $(PACKAGE_INTERVAL).text(intervalText);

    if (userDetails.subscription.card) {
        $(CHANGE_TIER_CARD_LAST4).text(userDetails.subscription.card.last4);
    }

    $(PACKAGE_CURRENT_PERIOD_END).text(formatters.formatDate(userDetails.subscription.end));
    $(PACKAGE_CURRENT_RENEWAL_DATE).text(formatters.formatDate(userDetails.subscription.renewalDate));

    if (userDetails.subscription.nextPaymentDate) {
        $(PACKAGE_NEXT_PAYMENT_DATE).text(formatters.formatDate(userDetails.subscription.nextPaymentDate));
        $(PACKAGE_NEXT_PAYMENT_CONTAINER).removeClass(IS_HIDDEN_CLASSNAME);
    }

    $(PACKAGE_NEXT_PAYMENT_PRICE).text(formatters.formatAmount(userDetails.subscription.nextPaymentPrice, glyph));

    if (userDetails.subscription.trialLength > 0) {
        $(TRIAL_INFO_CONTAINER).removeClass(IS_HIDDEN_CLASSNAME);
    }

    // display membership number
    if (userDetails.regNumber) {
        $(DETAILS_MEMBER_NUMBER_CONTAINER).removeClass(IS_HIDDEN_CLASSNAME);
        $(DETAILS_MEMBER_NUM_TEXT).text(userDetails.regNumber);
    }

    if (userDetails.subscription.start) {
        $(PACKAGE_CURRENT_PERIOD_START).text(formatters.formatDate(userDetails.subscription.start));
        $(PACKAGE_CURRENT_PERIOD_START_CONTAINER).removeClass(IS_HIDDEN_CLASSNAME);
    }

    // user has cancelled
    if (userDetails.subscription.cancelledAt) {
        // is this a tier change or a cancellation
        notificationTypeSelector = userDetails.optIn ? NOTIFICATION_CHANGE : NOTIFICATION_CANCEL;
        $(notificationTypeSelector).removeClass(IS_HIDDEN_CLASSNAME);
        $(MEMBER_DETAILS).addClass(IS_HIDDEN_CLASSNAME);
        $(DETAILS_MEMBERSHIP_TIER_ICON_CURRENT).addClass(`i-g-${userDetails.tier.toLowerCase()}`);
    } else if (userDetails.subscription.card) {
        // only show card details if user hasn't changed their subscription and has a payment method
        stripe.display(CARD_DETAILS, userDetails.subscription.card);
    }

    $(MEMBER_INFO).removeClass(IS_HIDDEN_CLASSNAME);
}

function displayMembershipUpSell() {
    $(UP_SELL).removeClass(IS_HIDDEN_CLASSNAME);
}

function init() {
    fetchUserDetails();
}

export default {
    init,
};
