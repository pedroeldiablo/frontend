import fastdomPromise from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import mediator from 'common/utils/mediator';
import debounce from 'lodash/functions/debounce';
import detect from 'common/utils/detect';
// Helper for full height elements as 100vh on mobile Chrome and Safari
// changes as the url bar slides in and out
// http://code.google.com/p/chromium/issues/detail?id=428132

const renderBlock = state => fastdomPromise.write(() => {
    state.$el.css('height', '');
}).then(() => {
    if (state.isMobile) {
        return fastdomPromise.read(() => state.$el.height()).then(height => fastdomPromise.write(() => {
            state.$el.css('height', height);
        }));
    }
});

const render = (state) => {
    state.elements.each((element) => {
        renderBlock({
            $el: $(element),
            isMobile: state.isMobile,
        });
    });
};

const getState = () => fastdomPromise.read(() => {
    const elements = $('.js-is-fixed-height');
    return {
        elements,
        isMobile: detect.getBreakpoint() === 'mobile',
    };
});

const onViewportChange = () => {
    getState().then(render);
};

const init = () => {
    mediator.on('window:resize', debounce(onViewportChange, 200));
    mediator.on('window:orientationchange', onViewportChange);
    onViewportChange();
};


export default {
    init,
};
