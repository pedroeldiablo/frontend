import partialRight from 'lodash/functions/partialRight';
// We make a new chainable with each operation to prevent mutations and
// thus allow multiple usages of a given chainable.

const createObject = prototype => {
    if (Object.create) {
        return Object.create(prototype);
    } else {
        const F = () => {};
        F.prototype = prototype;
        return new F();
    }
};

const makeChainable = (value, object) => {
    const chainable = createObject(object);
    chainable.setValue(value);
    return chainable;
};

// Chainable prototype
const Chainable = {
    setValue(value) {
        this.__value = value;
    },
    and(...args) {
        // Spread
        const fn = partialRight(...args);
        const newValue = fn(this.value());
        return makeChainable(newValue, this);
    },
    value() {
        return this.__value;
    },
    // Override prototype method
    valueOf() {
        return this.value();
    },
};

// Add array methods to chainable

const immutableArrayMethods = [
    'concat',
    'join',
    'reverse',
    'sort',
];
const mutableArrayMethods = [
    'slice',
    'shift',
    'pop',
    'push',
    'splice',
    'unshift',
];
immutableArrayMethods.forEach((methodName) => {
    Chainable[methodName] = function () {
        const args = Array.prototype.slice.call(arguments);
        const newValue = Array.prototype[methodName].apply(this.value(), args);
        return makeChainable(newValue, this);
    };
});
mutableArrayMethods.forEach((methodName) => {
    Chainable[methodName] = function () {
        const args = Array.prototype.slice.call(arguments);
        Array.prototype[methodName].apply(this.value(), args);
        return makeChainable(this.value(), this);
    };
});

export default function (value) {
    return makeChainable(value, Chainable);
}
