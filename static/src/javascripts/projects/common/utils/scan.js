import reduce from 'lodash/collections/reduce';
import last from 'lodash/arrays/last';
export default function(xs, f, z) {
    return reduce(xs, function(acc, x) {
        return acc.concat(f(last(acc), x));
    }, [z]);
};
