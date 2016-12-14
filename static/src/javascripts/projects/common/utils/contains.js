export default function (xs, x) {
    for (let i = 0; i < xs.length; ++i) {
        if (xs[i] === x) {
            return true;
        }
    }
    return false;
}
