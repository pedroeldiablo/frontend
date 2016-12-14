import text from 'text';

const buildText = {};

export default {

    load(name, req, onLoad, config) {
        const prefix = 'inline-';
        const dirs = name.split('/');
        const imageType = dirs[1];
        const fileName = dirs.pop();

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
            const name = `'${pluginName}!${moduleName}'`;
            const text = `function () {return '${buildText[moduleName]}';}`;

            write(`define(${name}, ${text});\n`);
        }
    },
};
