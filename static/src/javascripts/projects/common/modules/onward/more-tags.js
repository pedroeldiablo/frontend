/*
 Module: more-tags.js
 Description: upgrades the 'Tags' list on content with a show more.
 */
import $ from 'common/utils/$';
import bean from 'bean';

function MoreTags() {
    this.init = function() {
        var $more = $('.js-more-tags');
        if ($more.length !== 0) {
            $more.removeClass('modern-hidden');
            bean.on(document.querySelector('.js-more-tags__link'), 'click', function() {
                $('.modern-hidden-tag').removeClass('modern-hidden');
                $more.addClass('modern-hidden');
            });
        }
    };
}

export default MoreTags;
