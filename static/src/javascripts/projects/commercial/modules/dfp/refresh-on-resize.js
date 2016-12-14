import debounce from 'lodash/functions/debounce';
import detect from 'common/utils/detect';
import dfpEnv from 'commercial/modules/dfp/dfp-env';
import breakpointNameToAttribute from 'commercial/modules/dfp/breakpoint-name-to-attribute';
/* hasBreakpointChanged: ((string, string) -> undefined) -> undefined. Invokes the callback if a breakpoint has been crossed since last invocation */
const hasBreakpointChanged = detect.hasCrossedBreakpoint(true);

/* breakpointNames: array<string>. List of breakpoint names */
const breakpointNames = detect.breakpoints.map(_ => _.name);

/* resizeTimeout: integer. Number of milliseconds to debounce the resize event */
const resizeTimeout = 2000;

/* windowResize: () -> undefined. Resize handler */
const windowResize = debounce(() => {
    // refresh on resize
    hasBreakpointChanged(refresh);
}, resizeTimeout);

export default refreshOnResize;

function refreshOnResize() {
    window.addEventListener('resize', windowResize);
}

// TODO: reset advert flags
function refresh(currentBreakpoint, previousBreakpoint) {
    // only refresh if the slot needs to
    window.googletag.pubads().refresh(dfpEnv.advertsToRefresh.filter(shouldRefresh).map(_ => _.slot));

    function shouldRefresh(advert) {
        // get the slot breakpoints
        const slotBreakpoints = Object.keys(advert.sizes);
        // find the currently matching breakpoint
        const currentSlotBreakpoint = getBreakpointIndex(currentBreakpoint, slotBreakpoints);
        // find the previously matching breakpoint
        const previousSlotBreakpoint = getBreakpointIndex(previousBreakpoint, slotBreakpoints);
        return currentSlotBreakpoint !== -1 && currentSlotBreakpoint !== previousSlotBreakpoint;
    }

    function getBreakpointIndex(breakpoint, slotBreakpoints) {
        const validBreakpointNames = breakpointNames
            .slice(0, breakpointNames.indexOf(breakpoint) + 1)
            .map(breakpointNameToAttribute);
        return Math.max(...slotBreakpoints.map(_ => validBreakpointNames.lastIndexOf(_)));
    }
}
