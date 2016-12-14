import raven from 'raven';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
const guardian = window.guardian;

const app = guardian.app = guardian.app || {};

// attach raven to global object
app.raven = raven;

app.raven.config(
    `https://${config.page.sentryPublicApiKey}@${config.page.sentryHost}`, {
        whitelistUrls: [
            /localhost/, // will not actually log errors, but `shouldSendCallback` will be called
            /assets\.guim\.co\.uk/,
            /ophan\.co\.uk/,
        ],
        tags: {
            edition: config.page.edition,
            contentType: config.page.contentType,
            revisionNumber: config.page.revisionNumber,
        },
        dataCallback(data) {
            if (data.culprit) {
                data.culprit = data.culprit.replace(/\/[a-z\d]{32}(\/[^\/]+)$/, '$1');
            }
            data.tags.origin = (/j.ophan.co.uk/.test(data.culprit)) ? 'ophan' : 'app';
            return data;
        },
        shouldSendCallback(data) {
            const isDev = config.page.isDev;
            const isIgnored = typeof (data.tags.ignored) !== 'undefined' && data.tags.ignored;
            const adBlockerOn = detect.adblockInUseSync();

            if (isDev && !isIgnored) {
                // Some environments don't support or don't always expose the console object
                if (window.console && window.console.warn) {
                    window.console.warn('Raven captured error.', data);
                }
            }

            return config.switches.enableSentryReporting &&
                Math.random() < 0.1 && !isIgnored && !adBlockerOn && !isDev; // don't actually notify sentry in dev mode
        },
    }
);

// Report uncaught exceptions
app.raven.install();

export default app.raven;
