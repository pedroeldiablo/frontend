// thank you http://www.electrictoolbox.com/pad-number-zeroes-javascript/
export default function(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};
