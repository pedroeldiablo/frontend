import bean from 'bean';
import bonzo from 'bonzo';
import Promise from 'Promise';
import fastdom from 'common/utils/fastdom-promise';
import reportError from 'common/utils/report-error';
import 'commercial/modules/creatives/commercial-component';
import 'commercial/modules/creatives/gu-style-comcontent';
import 'commercial/modules/creatives/frame';
import 'commercial/modules/creatives/revealer';
import 'commercial/modules/creatives/fabric-v1';
import 'commercial/modules/creatives/fabric-expanding-v1';
import 'commercial/modules/creatives/fabric-expandable-video-v1';
import 'commercial/modules/creatives/fabric-expandable-video-v2';
import 'commercial/modules/creatives/fabric-video';
import 'commercial/modules/creatives/fluid250';
import 'commercial/modules/creatives/fluid250GoogleAndroid';
import 'commercial/modules/creatives/hosted-thrasher-multi';
import 'commercial/modules/creatives/scrollable-mpu';
import 'commercial/modules/creatives/scrollable-mpu-v2';
import 'commercial/modules/creatives/template';
/**
 * Not all adverts render themselves - some just provide data for templates that we implement in commercial.js.
 * This looks for any such data and, if we find it, renders the appropriate component.
 */
export default function applyCreativeTemplate(adSlot) {
    return getAdvertIframe(adSlot).then(function(iframe) {
        return renderCreativeTemplate(adSlot, iframe);
    });
};

function getAdvertIframe(adSlot) {
    return new Promise(function(resolve, reject) {
        // DFP will sometimes return empty iframes, denoted with a '__hidden__' parameter embedded in its ID.
        // We need to be sure only to select the ad content frame.
        var contentFrame = adSlot.querySelector('iframe:not([id*="__hidden__"])');

        if (!contentFrame) {
            reject();
        }
        // On IE, wait for the frame to load before interacting with it
        else if (contentFrame.readyState && contentFrame.readyState !== 'complete') {
            bean.on(contentFrame, 'readystatechange', function(e) {
                var updatedIFrame = e.srcElement;

                if (
                    /*eslint-disable valid-typeof*/
                    updatedIFrame &&
                    typeof updatedIFrame.readyState !== 'unknown' &&
                    updatedIFrame.readyState === 'complete'
                    /*eslint-enable valid-typeof*/
                ) {
                    bean.off(updatedIFrame, 'readystatechange');
                    resolve(contentFrame);
                }
            });
        } else {
            resolve(contentFrame);
        }
    });
}

function renderCreativeTemplate(adSlot, iFrame) {
    var creativeConfig = fetchCreativeConfig();

    if (creativeConfig) {
        return hideIframe()
            .then(JSON.parse)
            .then(renderCreative)
            .catch(function(err) {
                reportError('Failed to get creative JSON ' + err);
            });
    } else {
        return Promise.resolve(true);
    }

    function fetchCreativeConfig() {
        try {
            var breakoutScript = iFrame.contentDocument.body.querySelector('.breakout__script[type="application/json"]');
            return breakoutScript ? breakoutScript.innerHTML : null;
        } catch (err) {
            return null;
        }

    }

    function renderCreative(config) {
        return new Promise(function(resolve) {
            xxxrequirexxx(['commercial/modules/creatives/' + config.name], function(Creative) {
                resolve(new Creative(bonzo(adSlot), config.params, config.opts).create());
            });
        });
    }

    function hideIframe() {
        return fastdom.write(function() {
            iFrame.style.display = 'none';
            return creativeConfig;
        });
    }
}
