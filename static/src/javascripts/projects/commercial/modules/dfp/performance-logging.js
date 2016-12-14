import raven from 'common/utils/raven';
import config from 'common/utils/config';
import userTiming from 'common/utils/user-timing';
import beacon from 'common/modules/analytics/beacon';

const performanceLog = {
    viewId: 'unknown',
    tags: [],
    modules: [],
    adverts: [],
    baselines: [],
};
const primaryBaseline = 'primary';
const secondaryBaseline = 'secondary';

function setListeners(googletag) {
    googletag.pubads().addEventListener('slotRenderEnded', raven.wrap(reportTrackingData));
}

// moduleCheckpoint() is called when a module has finished execution.
// The baseline allows us to determine whether the module was called in the first
// boot phase (primary) or the second boot phase (secondary).
function moduleCheckpoint(module, baseline) {
    const timerEnd = userTiming.getCurrentTime();
    const timerStart = getBaseline(baseline);
    performanceLog.modules.push({
        name: module,
        start: timerStart,
        duration: timerEnd - timerStart,
    });
}

// moduleStart() and moduleEnd() can be used for measuring modules ad-hoc,
// when they don't align to a baseline.
function moduleStart(moduleName) {
    const timerStart = userTiming.getCurrentTime();
    performanceLog.modules.push({
        name: moduleName,
        start: timerStart,
    });
}

function moduleEnd(moduleName) {
    const timerEnd = userTiming.getCurrentTime();

    const moduleIndex = performanceLog.modules.map(module => module.name).indexOf(moduleName);

    if (moduleIndex != -1) {
        const module = performanceLog.modules[moduleIndex];
        module.duration = timerEnd - module.start;
    }
}

// updateAdvertMetric() is called whenever the advert timings need to be updated.
// It may be called multiple times for the same advert, so that we effectively update
// the object with additional timings.
function updateAdvertMetric(advert, metricName, metricValue) {
    performanceLog.adverts = performanceLog.adverts.filter(element => advert.id !== element.id);
    advert.timings[metricName] = metricValue;
    performanceLog.adverts.push(Object.freeze({
        id: advert.id,
        isEmpty: advert.isEmpty,
        createTime: advert.timings.createTime,
        startLoading: advert.timings.startLoading,
        dfpFetching: advert.timings.dfpFetching,
        dfpReceived: advert.timings.dfpReceived,
        dfpRendered: advert.timings.dfpRendered,
        stopLoading: advert.timings.stopLoading,
        startRendering: advert.timings.startRendering,
        stopRendering: advert.timings.stopRendering,
        loadingMethod: advert.timings.loadingMethod,
        lazyWaitComplete: advert.timings.lazyWaitComplete,
    }));
}

function addStartTimeBaseline(baselineName) {
    performanceLog.baselines.push({
        name: baselineName,
        startTime: userTiming.getCurrentTime(),
    });
}

function addEndTimeBaseline(baselineName) {
    performanceLog.baselines.forEach((baseline) => {
        if (baseline.name === baselineName) {
            baseline.endTime = userTiming.getCurrentTime();
        }
    });
}

function getBaseline(baselineName) {
    const index = performanceLog.baselines
        .map(_ => _.name)
        .indexOf(baselineName);
    return index > -1 ? performanceLog.baselines[index].startTime : 0;
}

function reportTrackingData() {
    if (config.tests.commercialClientLogging) {
        require(['ophan/ng'], (ophan) => {
            performanceLog.viewId = ophan.viewId;

            beacon.postJson('/commercial-report', JSON.stringify(performanceLog), true);
        });
    }
}

function addTag(tag) {
    performanceLog.tags.push(tag);
}

export default {
    setListeners,
    moduleCheckpoint,
    moduleStart,
    moduleEnd,
    updateAdvertMetric,
    addStartTimeBaseline,
    addEndTimeBaseline,
    primaryBaseline,
    secondaryBaseline,
    addTag,
};
