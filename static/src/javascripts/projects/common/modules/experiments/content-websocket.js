import bonzo from 'bonzo';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import raven from 'common/utils/raven';

function connect(config) {
    if (!detect.hasWebSocket()) {
        return;
    }

    let $pushedContent;
    let chatSocket = new window.WebSocket(config.page.onwardWebSocket);

    let receiveEvent = event => {
        if (event && 'data' in event) {
            const data = JSON.parse(event.data);

            if (data.error) {
                chatSocket.close();
            } else {
                $pushedContent = bonzo.create(`<div>${data.headline} ${data.url}</div>`);
                bonzo($pushedContent).addClass('pushed-content lazyloaded');
                $('.monocolumn-wrapper').after($pushedContent);
            }
        } else {
            raven.captureMessage('Invalid data returned from socket');
        }
    };

    let disconnectEvent = () => {
        chatSocket.close();
        connect(config);
    };

    chatSocket.onmessage = receiveEvent;
    chatSocket.onerror = disconnectEvent;
    chatSocket.onclose = disconnectEvent;
}

export default {
    connect,
};
