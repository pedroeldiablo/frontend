/*
    Swallows (and reports) exceptions. Designed to wrap around modules at the "bootstrap" level.
    For example "comments throwing an exception should not stop auto refresh"
 */
import reportError from 'common/utils/report-error';
const catchErrors = function (fn) {
    let error;
    try {
        fn();
    } catch (e) {
        error = e;
    }
    return error;
};

const log = function (name, error, reporter) {
    if (window.console && window.console.warn) {
        window.console.warn('Caught error.', error.stack);
    }
    if (!reporter) {
        reporter = reportError;
    }
    reporter(error, {
        module: name,
    }, false);
};

const catchErrorsAndLog = function (name, fn, reporter) {
    const error = catchErrors(fn);
    if (error) {
        log(name, error, reporter);
    }
};

const catchErrorsAndLogAll = function (modules) {
    modules.forEach((pair) => {
        const name = pair[0];
        const fn = pair[1];
        catchErrorsAndLog(name, fn);
    });
};

function makeBlocks(codeBlocks) {
    return codeBlocks.map(function (record) {
        return catchErrorsAndLog.bind(this, record[0], record[1]);
    });
}

export default {
    catchErrorsAndLog,
    catchErrorsAndLogAll,
    makeBlocks,
    log,
};
