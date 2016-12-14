import Promise from 'Promise';
import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import template from 'common/utils/template';
import steadyPage from 'common/utils/steady-page';
import identity from 'common/modules/identity/api';
import trackAdRender from 'common/modules/commercial/dfp/track-ad-render';
import commercialFeatures from 'common/modules/commercial/commercial-features';
import getCode from 'commercial/modules/third-party-tags/outbrain-codes';
import outbrainStr from 'text!commercial/views/outbrain.html';
import emailRunChecks from 'common/modules/email/run-checks';
import clash from 'common/modules/experiments/ab-test-clash';
const outbrainUrl = '//widgets.outbrain.com/outbrain.js';
const outbrainTpl = template(outbrainStr);

const selectors = {
    outbrain: {
        widget: '.js-outbrain',
        container: '.js-outbrain-container',
    },
    merchandising: {
        widget: '.js-container--commercial',
        container: '.js-outbrain-container',
    },
    nonCompliant: {
        widget: '.js-outbrain',
        container: '.js-outbrain-container',
    },
};

let emailSignupPromise;
let clashingABTestPromise;

function build(codes, breakpoint) {
    let html = outbrainTpl({
        widgetCode: codes.code || codes.image,
    });
    if (breakpoint !== 'mobile' && codes.text) {
        html += outbrainTpl({
            widgetCode: codes.text,
        });
    }
    return html;
}

const module = {
    load,
    tracking,
    init,
};

function load(target) {
    const slot = target in selectors ? target : 'defaults';
    const $outbrain = $(selectors.outbrain.widget);
    const $container = $(selectors.outbrain.container, $outbrain[0]);
    const breakpoint = detect.getBreakpoint();
    let widgetCodes;
    let widgetHtml;

    widgetCodes = getCode({
        slot,
        section: config.page.section,
        breakpoint,
    });
    widgetHtml = build(widgetCodes, breakpoint);
    if ($container.length) {
        return steadyPage.insert($container[0], () => {
            if (slot === 'merchandising') {
                $(selectors[slot].widget).replaceWith($outbrain[0]);
            }
            $container.append(widgetHtml);
            $outbrain.css('display', 'block');
        }).then(() => {
            module.tracking(widgetCodes.code || widgetCodes.image);
            require([`js!${outbrainUrl}`]);
        });
    }
}

function tracking(widgetCode) {
    // Ophan
    require(['ophan/ng'], (ophan) => {
        ophan.record({
            outbrain: {
                widgetId: widgetCode,
            },
        });
    });
}

function identityPolicy() {
    return !(identity.isUserLoggedIn() && config.page.commentable);
}

/*
 Loading Outbrain is dependent on successful return of high relevance component
 from DFP. AdBlock is blocking DFP calls so we are not getting any response and thus
 not loading Outbrain. As Outbrain is being partially loaded behind the adblock we can
 make the call instantly when we detect adBlock in use.
 */
function loadInstantly() {
    return !document.getElementById('dfp-ad--merchandising-high') ||
        detect.adblockInUseSync();
}


function checkDependencies() {
    return Promise.all([checkEmailSignup(), checkClashingABTest()])
        .then((result) => {
            function findEmail(value) {
                return value == 'nonCompliant';
            }

            return result.find(findEmail);
        })
        .catch(() => 'nonCompliant');
}

function checkClashingABTest() {
    if (!clashingABTestPromise) {
        clashingABTestPromise = new Promise((resolve) => {
            if (clash.userIsInAClashingAbTest()) {
                resolve('nonCompliant');
            } else {
                resolve();
            }
        });
    }

    return clashingABTestPromise;
}

function checkEmailSignup() {
    if (!emailSignupPromise) {
        emailSignupPromise = new Promise((resolve) => {
            if (config.switches.emailInArticleOutbrain &&
                emailRunChecks.getEmailInserted()) {
                // There is an email sign-up
                // so load the merchandising component
                resolve('nonCompliant');
            } else {
                resolve();
            }
        });
    }

    return emailSignupPromise;
}

function init() {
    if (commercialFeatures.outbrain &&
        !config.page.isFront &&
        !config.page.isPreview &&
        identityPolicy()
    ) {
        // if there is no merch component, load the outbrain widget right away
        if (loadInstantly()) {
            return checkDependencies().then((widgetType) => {
                widgetType ? module.load(widgetType) : module.load();
                return Promise.resolve(true);
            });
        }

        return trackAdRender('dfp-ad--merchandising-high').then(isHiResLoaded =>
            // if the high-priority merch component has loaded, we wait until
            // the low-priority one has loaded to decide if an outbrain widget is loaded
            // if it hasn't loaded, the outbrain widget is loaded at its default
            // location right away
             Promise.all([
                 isHiResLoaded,
                 isHiResLoaded ? trackAdRender('dfp-ad--merchandising') : true,
             ])).then((args) => {
                 const isHiResLoaded = args[0];
                 const isLoResLoaded = args[1];

                 if (isHiResLoaded) {
                     if (!isLoResLoaded) {
                         module.load('merchandising');
                     }
                 } else {
                     checkDependencies().then((widgetType) => {
                         widgetType ? module.load(widgetType) : module.load();
                     });
                 }
             });
    }

    return Promise.resolve(true);
}

export default module;
