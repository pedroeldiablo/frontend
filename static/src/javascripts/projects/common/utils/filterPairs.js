import map from 'lodash/collections/map';
import filter from 'lodash/collections/filter';
import chain from 'common/utils/chain';
export default function (pairs) {
    return chain(pairs).and(filter, pair => pair[1]).and(map, pair => pair[0]).value();
}
