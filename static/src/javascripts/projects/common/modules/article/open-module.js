import fastdom from 'fastdom';
import $ from 'common/utils/$';
import ajax from 'common/utils/ajax';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import spaceFiller from 'common/modules/article/space-filler';

function getSpacefinderRules() {
    return {
        bodySelector: '.js-article__body',
        slotSelector: ' > p',
        minAbove: 200,
        minBelow: 250,
        clearContentMeta: 50,
        selectors: {
            ' > h2': {
                minAbove: detect.getBreakpoint() === 'mobile' ? 20 : 0,
                minBelow: 200
            },
            ' > *:not(p):not(h2)': {
                minAbove: 35,
                minBelow: 300
            },
            ' .ad-slot': {
                minAbove: 150,
                minBelow: 200
            },
            ' .element-rich-link': {
                minAbove: 400,
                minBelow: 400
            }
        }
    };
}

export default {
    init: function() {
        if (config.page.openModule) {
            spaceFiller.fillSpace(getSpacefinderRules(), function(spaces) {
                ajax({
                    url: config.page.openModule,
                    crossOrigin: true,
                    method: 'get'
                }).then(function(resp) {
                    if (resp.html) {
                        fastdom.write(function() {
                            $.create(resp.html)
                                .addClass('element--supporting')
                                .insertBefore(spaces[0]);
                            $('.submeta-container--break').removeClass('submeta-container--break');
                        });
                    }
                });
            });
        }
    }
};
