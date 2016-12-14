import bean from 'bean';
import $ from 'common/utils/$';
import mediator from 'common/utils/mediator';

function FormstackIframe(el, config) {
    const self = this;

    self.init = () => {
        // Setup postMessage listener for events from "modules/identity/formstack"
        bean.on(window, 'message', (event) => {
            if (event.origin === config.page.idUrl) {
                self.onMessage(event);
            } else {

            }
        });

        mediator.on('window:resize', self.refreshHeight);

        // Listen for load of form confirmation or error page,
        // which has no form, so won't instantiate the Formstack module
        bean.on(el, 'load', () => {
            self.show();
            self.refreshHeight();
        });
    };

    self.onMessage = event => {
        switch (event.data) {
            case 'ready':
                self.show();
                self.refreshHeight();
                break;

            case 'unload':
                self.refreshHeight(true);
                break;

            case 'refreshHeight':
                self.refreshHeight();
                break;
        }
    };

    self.refreshHeight = reset => {
        if (reset) {
            // If a height is set on the iframe, the following calculation
            // will be at least that height, optionally reset first
            $(el).css({
                height: 0,
            });
        }

        let iframe = el.contentWindow.document;
        let body = iframe.body;
        let html = iframe.documentElement;

        let height = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);

        $(el).css({
            height,
        });
    };

    self.show = () => {
        $(el).removeClass('is-hidden');
    };
}

export default FormstackIframe;
