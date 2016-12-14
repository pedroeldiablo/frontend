import map from 'lodash/collections/map';
import filter from 'lodash/collections/filter';
import chain from 'common/utils/chain';
export default function(pairs) {
    return chain(pairs).and(filter, function(pair) {
        return pair[1];
    }).and(map, function(pair) {
        return pair[0];
    }).value();
};
