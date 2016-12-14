import $ from 'common/utils/$';
import config from 'common/utils/config';
import fetchJson from 'common/utils/fetch-json';
import reportError from 'common/utils/report-error';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import stockValueTemplate from 'text!common/views/business/stock-value.html';
import stocksTemplate from 'text!common/views/business/stocks.html';
import contains from 'lodash/collections/contains';
import map from 'lodash/collections/map';

function isBusinessFront() {
    return contains(['uk/business', 'us/business', 'au/business'], config.page.pageId);
}

function getStocksData() {
    return fetchJson('/business-data/stocks.json', {
        mode: 'cors',
    })
        .catch((ex) => {
            reportError(ex, {
                feature: 'stocks',
            });
        });
}

function deltaString(n) {
    return n > 0 ? `+${n}` : `${n}`;
}

function renderData(data) {
    const stockValues = map(data.stocks, stockValue => template(stockValueTemplate, {
        name: stockValue.name,
        deltaClass: `stocks__stock-value--${stockValue.trend}`,
        price: stockValue.price,
        change: deltaString(stockValue.change),
        closed: stockValue.closed ? '<div class="stocks__closed">closed</div>' : '',
        closedInline: stockValue.closed ? '<div class="stocks__closed--inline">closed</div>' : '',
        marketDownIcon: svgs('marketDownIcon', ['stocks__icon', 'stocks__icon--down']),
        marketUpIcon: svgs('marketUpIcon', ['stocks__icon', 'stocks__icon--up']),
        marketSameIcon: svgs('marketSameIcon', ['stocks__icon', 'stocks__icon--same']),
    })).join('');

    return template(stocksTemplate, {
        stocks: stockValues,
    });
}

export default function () {
    const $container = $('.js-container--first .js-container__header');

    if (isBusinessFront() && $container) {
        getStocksData().then((data) => {
            if (data.stocks.length > 0) {
                $container.append(renderData(data));
            }
        });
    }
}
