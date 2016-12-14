import abTests from 'common/modules/experiments/ab';
import Report from 'admin/modules/abtests/abtest-report';
import ReportItem from 'admin/modules/abtests/abtest-report-item';
import Audience from 'admin/modules/abtests/audience';

function renderTests(tests, active, elem) {
    const items = tests.map(test => new ReportItem({
        test,
        active,
    }));
    items.forEach((i) => {
        i.render(elem);
    });
    return items;
}

function initialise() {
    renderTests(abTests.getActiveTests(), true, document.querySelector('.abtests-report__data'));
    const expiredTestItems = renderTests(abTests.getExpiredTests(), false, document.querySelector('.abtests-expired'));

    // Display audience breakdown.
    const audience = new Audience({
        tests: abTests.getActiveTests(),
    });
    audience.render(document.querySelector('.abtests-audience'));

    const expired = document.querySelector('.abtests-expired');

    document.querySelectory('.abtests-expired-title a').addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.textContent === 'show') {
            e.target.textContent = 'hide';
            expired.style.display = 'block';
            expiredTestItems.forEach((t) => {
                t.renderChart();
            });
        } else {
            e.target.textContent = 'show';
            expired.style.display = 'none';
        }
    });

    // timeout on this to allow google charts to render before hiding the container
    setTimeout(() => {
        expired.style.display = 'none';
    }, 0);
}

export default {
    init: initialise,
};
