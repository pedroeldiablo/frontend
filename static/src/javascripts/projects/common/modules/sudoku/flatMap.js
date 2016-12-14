import map from 'lodash/collections/map';
export default function(xs, f) {
    return Array.prototype.concat.apply([], map(xs, f));
};
