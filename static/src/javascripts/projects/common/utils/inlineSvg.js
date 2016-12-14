import text from 'text';

const buildText = {};

export default {

    load(name, req, onLoad, config) {
        let prefix = 'inline-',
            dirs = name.split('/'),
            imageType = dirs[1],
            fileName = dirs.pop();

        text.get(req.toUrl(`${dirs.join('/')}/${fileName}.svg`), (svg) => {
            svg = `<span class=\"${prefix}${fileName} ${imageType !== '' ? prefix + imageType : ''}\">${svg}</span>`;

            if (config.isBuild) {
                buildText[name] = text.jsEscape(svg);
            }

            onLoad(svg);
        }, onLoad.error);
    },

    write(pluginName, moduleName, write) {
        if (buildText.hasOwnProperty(moduleName)) {
            let name = `'${pluginName}!${moduleName}'`,
                text = `function () {return '${buildText[moduleName]}';}`;

            write(`define(${name}, ${text});\n`);
        }
    },
};
