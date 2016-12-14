import fastdom from 'fastdom';
import $ from 'common/utils/$';
import fetchJson from 'common/utils/fetch-json';
import reportError from 'common/utils/report-error';

let ELEMENT_INITIAL_CLASS = 'element-membership--not-upgraded';
let ELEMENT_UPGRADED_CLASS = 'element-membership--upgraded';

function upgradeEvent(el) {
    let href = $('a', el).attr('href');
    let matches = href.match(/https:\/\/membership.theguardian.com/);

    if (matches) {
        fetchJson(`${href}/card`, {
            mode: 'cors',
        }).then((resp) => {
            if (resp.html) {
                fastdom.write(() => {
                    $(el).html(resp.html)
                        .removeClass(ELEMENT_INITIAL_CLASS)
                        .addClass(ELEMENT_UPGRADED_CLASS);
                });
            }
        })
            .catch((ex) => {
                reportError(ex, {
                    feature: 'membership-events',
                });
            });
    }
}

function upgradeEvents() {
    $(`.${ELEMENT_INITIAL_CLASS}`).each(upgradeEvent);
}

export default {
    upgradeEvent,
    upgradeEvents,
};
