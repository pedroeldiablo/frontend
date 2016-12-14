import $ from 'common/utils/$';
import qwery from 'qwery';
import bonzo from 'bonzo';
import bean from 'bean';
import fastdom from 'fastdom';
import config from 'common/utils/config';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import deleteButtonAllTmp from 'text!common/views/save-for-later/delete-all-button.html';
export default function SavedForLater() {
    this.init = function () {
        let self = this,
            deleteAll = $('.js-save-for-later__delete-all')[0];

        if (deleteAll) {
            this.renderDeleteButton('delete');
            bean.one(deleteAll, 'click', '.js-save-for-later__button', (event) => {
                event.preventDefault();
                self.renderDeleteButton('confirm');
            });
        }
    };

    this.renderDeleteButton = function (state) {
        fastdom.read(() => {
            const $button = bonzo(qwery('.js-save-for-later__delete-all')[0]);

            fastdom.write(() => {
                $button.html(template(deleteButtonAllTmp, {
                    icon: svgs('crossIcon'),
                    state,
                    dataLinkName: `saved | remove all${state === 'confirm' ? ' | confirm' : ''}`,
                }));
            });
        });
        if (state === 'confirm') {
            setTimeout(this.init.bind(this), 2000);
        }
    };
}
