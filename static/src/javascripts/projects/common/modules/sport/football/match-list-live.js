import bonzo from 'bonzo';
import $ from 'common/utils/$';
import component from 'common/modules/component';

const MatchList = function (type, competition, date) {
    this.endpoint += `${['football', type, competition, date].filter(e => e).join('/')}.json`;
};
component.define(MatchList);

MatchList.prototype.endpoint = '/';
MatchList.prototype.autoupdated = true;
MatchList.prototype.updateEvery = 10;

MatchList.prototype.prerender = function () {
    const elem = this.elem;
    $('.football-team__form', elem).remove();
    $('.date-divider', elem).remove();
    $(this.elem).addClass('table--small');

    $('.football-matches__date', this.elem).replaceWith('<span class="item__live-indicator">Live</span>');
};

MatchList.prototype.autoupdate = function (elem) {
    let updated = $('.football-match', elem);
    let self = this;
    let $match;
    let $updated;

    $('.football-match', this.elem).each((match, i) => {
        $match = bonzo(match).removeClass('football-match--updated');
        $updated = bonzo(updated[i]);

        ['score-home', 'score-away', 'match-status'].forEach((state) => {
            state = `data-${state}`;
            if ($updated.attr(state) !== $match.attr(state)) {
                $match.replaceWith($updated.addClass('football-match--updated'));
                self.prerender();
            }
        });
    });
};

export default MatchList; // define
