// utility module for creating basic easing functions
// Usage:
// var ease = easing.create('easeOutQuint', 3000); // creates a 3 second duration easing function
// ease(); // each call will return a value from 0 (at t=0) to 1.0 (at t>=duration)

const easingFunctions = { // https://gist.github.com/gre/1650294
    // no easing, no acceleration
    linear(t) {
        return t;
    },
    // accelerating from zero velocity
    easeInQuad(t) {
        return t * t;
    },
    // decelerating to zero velocity
    easeOutQuad(t) {
        return t * (2 - t);
    },
    // acceleration until halfway, then deceleration
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    // accelerating from zero velocity
    easeInCubic(t) {
        return t * t * t;
    },
    // decelerating to zero velocity
    easeOutCubic(t) {
        return (--t) * t * t + 1;
    },
    // acceleration until halfway, then deceleration
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    // accelerating from zero velocity
    easeInQuart(t) {
        return t * t * t * t;
    },
    // decelerating to zero velocity
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    },
    // acceleration until halfway, then deceleration
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    // accelerating from zero velocity
    easeInQuint(t) {
        return t * t * t * t * t;
    },
    // decelerating to zero velocity
    easeOutQuint(t) {
        return 1 + (--t) * t * t * t * t;
    },
    // acceleration until halfway, then deceleration
    easeInOutQuint(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    },
};

function createEasingFn(type, duration) {
    let startTime = new Date(),
        ease = easingFunctions[type];
    return function () {
        const elapsed = (new Date()) - startTime;
        return ease(Math.min(1, elapsed / duration));
    };
}

export default {
    functions: easingFunctions,
    create: createEasingFn,
};
