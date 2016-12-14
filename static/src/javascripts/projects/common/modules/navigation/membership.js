import userFeatures from 'common/modules/commercial/user-features';
import fastdom from 'common/utils/fastdom-promise';
import Promise from 'Promise';
import $ from 'common/utils/$';
const LAST_CLASS = 'brand-bar__item--split--last';

function init() {
    if (userFeatures.isPayingMember()) {
        const $becomeMemberLink = $('.js-become-member');
        const $subscriberLink = $('.js-subscribe');
        fastdom.write(() => {
            $becomeMemberLink.attr('hidden', 'hidden');
            $subscriberLink.removeClass(LAST_CLASS);
        });
    }
}

export default init;
