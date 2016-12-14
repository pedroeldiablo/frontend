export default dropWhile;

/**
 * Returns a subset of arr from the first element x where f(x) is false on.
 */
function dropWhile(f, arr) {
    let i = -1;
    const size = arr.length;
    let dropping;

    do {
        i += 1;
        dropping = i < size && f(arr[i], i, arr);
    } while (dropping);

    return arr.slice(i);
}
