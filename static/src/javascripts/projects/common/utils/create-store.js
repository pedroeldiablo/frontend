// Mini Redux
const createStore = function (reducer, initialState) {
    // We re-assign this over time
    let state = initialState;
    const subscribers = [];

    const notify = function () {
        subscribers.forEach((fn) => {
            fn();
        });
    };
    const dispatch = function (action) {
        state = reducer(state, action);
        notify();
    };
    const subscribe = function (fn) {
        subscribers.push(fn);
    };
    const getState = function () {
        return state;
    };

    dispatch({
        type: 'INIT',
    });

    return {
        dispatch,
        subscribe,
        getState,
    };
};

export default createStore;
