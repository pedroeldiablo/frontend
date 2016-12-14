import formInlineLabels from 'common/utils/formInlineLabels';
import bean from 'bean';
import bonzo from 'bonzo';
import qwery from 'qwery';
import fastdom from 'fastdom';
import Promise from 'Promise';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import fetch from 'common/utils/fetch';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import robust from 'common/utils/robust';
import googleAnalytics from 'common/modules/analytics/google';
import debounce from 'lodash/functions/debounce';
import contains from 'lodash/collections/contains';
import svgs from 'common/views/svgs';
import successHtml from 'text!common/views/email/submissionResponse.html';
import closeHtml from 'text!common/views/ui/close-button.html';
import Id from 'common/modules/identity/api';
import userPrefs from 'common/modules/user-prefs';
import uniq from 'lodash/arrays/uniq';

const state = {
    submitting: false,
};

const messages = {
    defaultSuccessHeadline: 'Thank you for subscribing',
    defaultSuccessDesc: '',
};

const updateForm = {
    replaceContent(isSuccess, $form) {
        let formData = $form.data('formData');

        let submissionMessage = {
            statusClass: (isSuccess) ? 'email-sub__message--success' : 'email-sub__message--failure',
            submissionHeadline: (isSuccess) ? formData.customSuccessHeadline || messages.defaultSuccessHeadline : 'Something went wrong',
            submissionMessage: (isSuccess) ? formData.customSuccessDesc || messages.defaultSuccessDesc : 'Please try again.',
            submissionIcon: (isSuccess) ? svgs('tick') : svgs('crossIcon'),
        };

        let submissionHtml = template(successHtml, submissionMessage);

        fastdom.write(() => {
            $form.addClass('email-sub__form--is-hidden');
            $form.after(submissionHtml);
        });
    },
};

function handleSubmit(isSuccess, $form) {
    return () => {
        updateForm.replaceContent(isSuccess, $form);
        state.submitting = false;
    };
}

let classes = {
        wrapper: 'js-email-sub',
        form: 'js-email-sub__form',
        inlineLabel: 'js-email-sub__inline-label',
        textInput: 'js-email-sub__text-input',
        listIdHiddenInput: 'js-email-sub__listid-input',
    };

let removeAndRemember = (e, data) => {
    let iframe = data[0];
    let analytics = data[1];
    let currentListPrefs = userPrefs.get(`email-sign-up-${analytics.formType}`) || [];

    currentListPrefs.push(`${analytics.listId}`);
    userPrefs.set(`email-sign-up-${analytics.formType}`, uniq(currentListPrefs));

    $(iframe).remove();

    googleAnalytics.trackNonClickInteraction(`rtrt | email form inline | ${analytics.formType} | ${analytics.listId} | ${analytics.signedIn} | form hidden`);
};

let ui = {
    updateForm(thisRootEl, el, analytics, opts) {
        let formData = $(thisRootEl).data();
        let formTitle = (opts && opts.formTitle) || formData.formTitle || false;
        let formDescription = (opts && opts.formDescription) || formData.formDescription || false;
        let formCampaignCode = (opts && opts.formCampaignCode) || formData.formCampaignCode || '';
        let formSuccessHeadline = (opts && opts.formSuccessHeadline) || formData.formSuccessHeadline;
        let formSuccessDesc = (opts && opts.formSuccessDesc) || formData.formSuccessDesc;
        let removeComforter = (opts && opts.removeComforter) || formData.removeComforter || false;
        let formModClass = (opts && opts.formModClass) || formData.formModClass || false;
        let formCloseButton = (opts && opts.formCloseButton) || formData.formCloseButton || false;

        Id.getUserFromApi((userFromId) => {
            ui.updateFormForLoggedIn(userFromId, el);
        });

        fastdom.write(() => {
            if (formTitle) {
                $('.js-email-sub__heading', el).text(formTitle);
            }

            if (formDescription) {
                $('.js-email-sub__description', el).text(formDescription);
            }

            if (removeComforter) {
                $('.js-email-sub__small', el).remove();
            }

            if (formModClass) {
                $(el).addClass(`email-sub--${formModClass}`);
            }

            if (formCloseButton) {
                let closeButtonTemplate = {
                        closeIcon: svgs('closeCentralIcon'),
                    };

                let closeButtonHtml = template(closeHtml, closeButtonTemplate);

                el.append(closeButtonHtml);

                bean.on(el[0], 'click', '.js-email-sub--close', removeAndRemember, [thisRootEl, analytics]);
            }
        });

        // Cache data on the form element
        $('.js-email-sub__form', el).data('formData', {
            campaignCode: formCampaignCode,
            referrer: window.location.href,
            customSuccessHeadline: formSuccessHeadline,
            customSuccessDesc: formSuccessDesc,
        });
    },
    updateFormForLoggedIn(userFromId, el) {
        if (userFromId && userFromId.primaryEmailAddress) {
            fastdom.write(() => {
                $('.js-email-sub__inline-label', el).addClass('email-sub__inline-label--is-hidden');
                $('.js-email-sub__submit-input', el).addClass('email-sub__submit-input--solo');
                $('.js-email-sub__text-input', el).val(userFromId.primaryEmailAddress);
            });
        }
    },
    freezeHeight($wrapper, reset) {
        let wrapperHeight;

        let getHeight = () => {
            fastdom.read(() => {
                wrapperHeight = $wrapper[0].clientHeight;
            });
        };

        let setHeight = () => {
            fastdom.defer(() => {
                $wrapper.css('min-height', wrapperHeight);
            });
        };

        let resetHeight = () => {
            fastdom.write(() => {
                $wrapper.css('min-height', '');
                getHeight();
                setHeight();
            });
        };

        return () => {
            if (reset) {
                resetHeight();
            } else {
                getHeight();
                setHeight();
            }
        };
    },
    setIframeHeight(iFrameEl, callback) {
        return () => {
            fastdom.write(() => {
                iFrameEl.height = '';
                iFrameEl.height = `${iFrameEl.contentWindow.document.body.clientHeight}px`;
                callback.call();
            });
        };
    },
};

let formSubmission = {
    bindSubmit($form, analytics) {
        const url = '/email';
        bean.on($form[0], 'submit', this.submitForm($form, url, analytics));
    },
    submitForm($form, url, analytics) {
        /**
         * simplistic email address validation to prevent misfired
         * omniture events
         *
         * @param  {String} emailAddress
         * @return {Boolean}
         */
        function validate(emailAddress) {
            return typeof emailAddress === 'string' &&
                emailAddress.indexOf('@') > -1;
        }

        return event => {
            let emailAddress = $(`.${classes.textInput}`, $form).val();
            let listId = $(`.${classes.listIdHiddenInput}`, $form).val();
            let analyticsInfo;

            event.preventDefault();

            if (!state.submitting && validate(emailAddress)) {
                let formData = $form.data('formData');

                let data = `email=${encodeURIComponent(emailAddress)
                }&listId=${listId
                }&campaignCode=${formData.campaignCode
                }&referrer=${formData.referrer}`;

                analyticsInfo = `rtrt | email form inline | ${analytics.formType} | ${analytics.listId} | ${analytics.signedIn} | ` + '%action%';

                state.submitting = true;

                return new Promise(() => {
                    googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'subscribe clicked'));
                    return fetch(config.page.ajaxUrl + url, {
                        method: 'post',
                        body: data,
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
                            }
                        })
                        .then(() => {
                            googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'subscribe successful'));
                        })
                        .then(handleSubmit(true, $form))
                        .catch((error) => {
                            robust.log('c-email', error);
                            googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'error'));
                            handleSubmit(false, $form)();
                        });
                });
            }
        };
    },
};

let setup = (rootEl, thisRootEl, isIframed) => {
    $(`.${classes.inlineLabel}`, thisRootEl).each((el) => {
        formInlineLabels.init(el, {
            textInputClass: '.js-email-sub__text-input',
            labelClass: '.js-email-sub__label',
            hiddenLabelClass: 'email-sub__label--is-hidden',
            labelEnabledClass: 'email-sub__inline-label--enabled',
        });
    });

    $(`.${classes.wrapper}`, thisRootEl).each((el) => {
        let $el = $(el);
        let freezeHeight = ui.freezeHeight($el, false);
        let freezeHeightReset = ui.freezeHeight($el, true);
        let $formEl = $(`.${classes.form}`, el);

        let analytics = {
            formType: $formEl.data('email-form-type'),
            listId: $formEl.data('email-list-id'),
            signedIn: (Id.isUserLoggedIn()) ? 'user signed-in' : 'user not signed-in',
        };

        formSubmission.bindSubmit($formEl, analytics);

        // If we're in an iframe, we should check whether we need to add a title and description
        // from the data attributes on the iframe (eg: allowing us to set them from composer)
        if (isIframed) {
            ui.updateForm(rootEl, $el, analytics);
        }

        // Ensure our form is the right height, both in iframe and outside
        (isIframed) ? ui.setIframeHeight(rootEl, freezeHeight).call() : freezeHeight.call();

        mediator.on('window:resize',
            debounce((isIframed) ? ui.setIframeHeight(rootEl, freezeHeightReset) : freezeHeightReset, 500)
        );
    });
};

export default {
    updateForm: ui.updateForm,
    init(rootEl) {
        let browser = detect.getUserAgent.browser;
        let version = detect.getUserAgent.version;
        // If we're in lte IE9, don't run the init and adjust the footer
        if (browser === 'MSIE' && contains(['7', '8', '9'], `${version}`)) {
            $('.js-footer__secondary').addClass('l-footer__secondary--no-email');
            $('.js-footer__email-container', '.js-footer__secondary').addClass('is-hidden');
        } else {
            // We're loading through the iframe
            if (rootEl && rootEl.tagName === 'IFRAME') {
                // We can listen for a lazy load or reload to catch an update
                setup(rootEl, rootEl.contentDocument.body, true);
                bean.on(rootEl, 'load', () => {
                    setup(rootEl, rootEl.contentDocument.body, true);
                });
            } else {
                setup(rootEl, rootEl || document, false);
            }
        }
    },
};
