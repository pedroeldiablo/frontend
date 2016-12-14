import bonzo from 'bonzo';
import $ from 'common/utils/$';
import Doughnut from 'common/modules/charts/doughnut';

const TableDoughnut = function () {};

/**
 * @param {Element} el
 * @return {Bonzo} the SVG Element
 */
TableDoughnut.prototype.render = function (el) {
    let $doughnut,
        currentClasses,
        width = el.scrollWidth || el.getAttribute('data-chart-width'),
        headings = $('th', el),
        data = $('td', el).map((el, i) => ({
            label: headings[i].innerHTML,
            value: parseInt(el.getAttribute('data-chart-value'), 10),
            color: el.getAttribute('data-chart-color'),
        }));

    bonzo(el).addClass('u-h');
    $doughnut = new Doughnut(data, {
        showValues: el.getAttribute('data-chart-show-values') === 'true',
        unit: el.getAttribute('data-chart-unit'),
        width,
    });
    // can't use bonzo's class methods, don't play well in IE
    currentClasses = $doughnut.attr('class');
    return $doughnut
        .attr('class', `${currentClasses} ${el.getAttribute('data-chart-class')}`)
        .insertAfter(el);
};

export default TableDoughnut; // define
