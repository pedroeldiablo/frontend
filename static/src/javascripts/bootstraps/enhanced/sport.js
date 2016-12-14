import bean from 'bean';
import $ from 'common/utils/$';
import template from 'common/utils/template';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import page from 'common/utils/page';
import Doughnut from 'common/modules/charts/table-doughnut';
import Component from 'common/modules/component';
import ScoreBoard from 'common/modules/sport/score-board';
import rhc from 'common/modules/ui/rhc';

function cricket() {
    let cricketScore;
    let parentEl;
    let matchDate = config.page.cricketMatchDate;
    let team = config.page.cricketTeam;

    if (matchDate && team) {
        cricketScore = new Component();
        parentEl = $('.js-cricket-score')[0];

        cricketScore.endpoint = `/sport/cricket/match/${matchDate}/${team}.json`;
        cricketScore.fetch(parentEl, 'summary');
    }
}

function rugby() {
    let pageType = '';

    if (config.page.isLiveBlog) {
        pageType = 'minbymin';
    } else if (config.hasTone('Match reports')) {
        pageType = 'report';
    }

    if (config.page.rugbyMatch && pageType) {
        const $h = $('.js-score');

        const scoreBoard = new ScoreBoard({
            pageType,
            parent: $h,
            autoupdated: config.page.isLive,
            responseDataKey: 'matchSummary',
            endpoint: `${config.page.rugbyMatch}.json?page=${encodeURIComponent(config.page.pageId)}`,
        });

        // Rugby score returns the match nav too, to optimise calls.
        scoreBoard.fetched = resp => {
            $('.content--liveblog').addClass('content--liveblog--rugby');

            $.create(resp.nav).first().each((nav) => {
                // There ought to be exactly two tabs; match report and min-by-min
                if ($('.tabs__tab', nav).length === 2) {
                    $('.js-sport-tabs').empty();
                    $('.js-sport-tabs').append(nav);
                }
            });

            const contentString = resp.scoreEvents;
            if (detect.isBreakpoint({
                max: 'mobile',
            })) {
                const $scoreEventsMobile = $.create(template(resp.dropdown)({
                    name: 'Score breakdown',
                    content: contentString,
                }));
                if (config.page.isLiveBlog) {
                    $scoreEventsMobile.addClass('dropdown--key-events');
                }
                $scoreEventsMobile.addClass('dropdown--active');
                $('.js-after-article').append($scoreEventsMobile);
            } else {
                const $scoreEventsTabletUp = $.create(contentString);
                $scoreEventsTabletUp.addClass('hide-on-mobile');

                $('.rugby-stats').remove();

                $('.score-container').after($scoreEventsTabletUp);
            }

            $('.match-stats__container').remove();
            $.create(`<div class="match-stats__container">${resp.matchStat}</div>`).each((container) => {
                $('.js-chart', container).each((el) => {
                    new Doughnut().render(el);
                });
                const extras = [];
                extras[0] = {
                    name: 'Match stats',
                    importance: 3,
                    content: container,
                    ready: true,
                };
                renderExtras(extras);
            });

            $('.js-football-table').remove();
            $.create(`<div class="js-football-table" data-link-name="football-table-embed">${resp.groupTable}</div>`).each((container) => {
                const extras = [];
                extras[0] = {
                    name: 'Table',
                    importance: 3,
                    content: container,
                    ready: true,
                };
                renderExtras(extras);
            });
        };

        scoreBoard.load();
    }
}

function renderExtras(extras, dropdownTemplate) {
    // clean
    extras = extras.filter(extra => extra);
    const ready = extras.filter(extra => extra.ready === false).length === 0;

    if (ready) {
        page.belowArticleVisible(() => {
            let b;
            $('.js-after-article').append(
                $.create('<div class="football-extras"></div>').each((extrasContainer) => {
                    extras.forEach((extra, i) => {
                        if (dropdownTemplate) {
                            $.create(dropdownTemplate).each((dropdown) => {
                                if (config.page.isLiveBlog) {
                                    $(dropdown).addClass('dropdown--key-events');
                                }
                                $('.dropdown__label', dropdown).append(extra.name);
                                $('.dropdown__content', dropdown).append(extra.content);
                                $('.dropdown__button', dropdown)
                                    .attr('data-link-name', `Show dropdown: ${extra.name}`)
                                    .each((el) => {
                                        if (i === 0) {
                                            b = el;
                                        }
                                    });
                            }).appendTo(extrasContainer);
                        } else {
                            extrasContainer.appendChild(extra.content);
                        }
                    });
                })
            );

            // unfortunately this is here as the buttons event is delegated
            // so it needs to be in the dom
            if (b) {
                bean.fire(b, 'click');
            }
        }, () => {
            extras.forEach((extra) => {
                rhc.addComponent(extra.content, extra.importance);
            });
        });
    }
}

function init() {
    cricket();
    rugby();
}

export default {
    init,
};
