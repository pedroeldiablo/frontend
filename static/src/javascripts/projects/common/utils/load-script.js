import Promise from 'Promise';
export default loadScript;

function loadScript(props, attrs) {
    return new Promise((resolve) => {
        if (props && props.id && document.getElementById(props.id)) {
            resolve();
        }
        const ref = document.scripts[0];
        const script = document.createElement('script');
        if (props) {
            Object.keys(props).forEach((prop) => {
                script[prop] = props[prop];
            });
        }
        if (attrs) {
            Object.keys(attrs).forEach((attr) => {
                script.setAttribute(attr, attrs[attr]);
            });
        }
        script.onload = resolve;
        ref.parentNode.insertBefore(script, ref);
    });
}
