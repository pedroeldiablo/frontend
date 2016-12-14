import messenger from 'commercial/modules/messenger';
const aProto = Array.prototype;

messenger.register('get-styles', specs => getStyles(specs, document.styleSheets));
export default getStyles;

function getStyles(specs, styleSheets) {
    if (!specs || typeof specs.selector !== 'string') {
        return null;
    }

    let i = 0;
    const ii = styleSheets.length;
    const result = [];
    while (i < ii) {
        const sheet = styleSheets[i++];
        if (!sheet.ownerNode || !sheet.ownerNode.matches) {
            continue;
        }

        if (!sheet.ownerNode.matches(specs.selector)) {
            continue;
        }

        if (sheet.ownerNode.tagName === 'STYLE') {
            result.push(sheet.ownerNode.textContent);
        } else {
            result.push(aProto.reduce.call(sheet.cssRules, (res, input) => res + input.cssText, ''));
        }
    }

    return result;
}
