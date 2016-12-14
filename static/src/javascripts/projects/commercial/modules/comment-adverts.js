import Promise from 'Promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import idleFastdom from 'common/utils/fastdom-idle';
import identityApi from 'common/modules/identity/api';
import ab from 'common/modules/experiments/ab';
import addSlot from 'common/modules/commercial/dfp/add-slot';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import createSlot from 'common/modules/commercial/dfp/create-slot';
import defaults from 'lodash/objects/defaults';
export default function (options) {
    let adType;

    const opts = defaults(
        options || {}, {
            adSlotContainerSelector: '.js-discussion__ad-slot',
            commentMainColumn: '.content__main-column',
        }
    );

    let $adSlotContainer;
    let $commentMainColumn;
    let $adSlot;

    $adSlotContainer = $(opts.adSlotContainerSelector);
    $commentMainColumn = $(opts.commentMainColumn, '.js-comments');

    if (!commercialFeatures.commentAdverts || !$adSlotContainer.length) {
        return false;
    }

    mediator.once('modules:comments:renderComments:rendered', () => {
        idleFastdom.read(() => {
            // if comments container is lower than 280px
            if ($commentMainColumn.dim().height < 280) {
                return false;
            }

            idleFastdom.write(() => {
                $commentMainColumn.addClass('discussion__ad-wrapper');

                if (!config.page.isLiveBlog && !config.page.isMinuteArticle) {
                    $commentMainColumn.addClass('discussion__ad-wrapper-wider');
                }

                adType = 'comments';

                $adSlot = $(createSlot(adType, 'mpu-banner-ad'));
                $adSlotContainer.append($adSlot);
                addSlot($adSlot);
            });
        });
    });
}
