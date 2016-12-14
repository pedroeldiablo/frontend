export default takeWhile;

/**
 * Returns a subset of arr from the beginning until the first element x
 * where f(x) is false (not included).
 */
function takeWhile(f, arr) {
    let i = -1;
    const size = arr.length;
    let taking;

    do {
        i += 1;
        taking = i < size && f(arr[i], i, arr);
    } while (taking);

    return arr.slice(0, i);
}
