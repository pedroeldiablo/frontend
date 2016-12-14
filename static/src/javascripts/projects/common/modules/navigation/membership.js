import userFeatures from 'common/modules/commercial/user-features';
import fastdom from 'common/utils/fastdom-promise';
import Promise from 'Promise';
import $ from 'common/utils/$';
var LAST_CLASS = 'brand-bar__item--split--last';

function init() {
    if (userFeatures.isPayingMember()) {
        var $becomeMemberLink = $('.js-become-member');
        var $subscriberLink = $('.js-subscribe');
        fastdom.write(function() {
            $becomeMemberLink.attr('hidden', 'hidden');
            $subscriberLink.removeClass(LAST_CLASS);
        });
    }
}

export default init;
