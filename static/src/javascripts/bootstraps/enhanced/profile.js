import $ from 'common/utils/$';
import qwery from 'qwery';
import Identity from 'common/modules/identity/forms';
import Formstack from 'common/modules/identity/formstack';
import FormstackIframe from 'common/modules/identity/formstack-iframe';
import FormstackEmbedIframe from 'common/modules/identity/formstack-iframe-embed';
import ValidationEmail from 'common/modules/identity/validation-email';
import Id from 'common/modules/identity/api';
import AccountProfile from 'common/modules/identity/account-profile';
import PublicProfile from 'common/modules/identity/public-profile';
import SavedForLater from 'common/modules/identity/saved-for-later';
import EmailPreferences from 'common/modules/identity/email-preferences';
import UserAvatars from 'common/modules/discussion/user-avatars';
import mediator from 'common/utils/mediator';
import Tabs from 'common/modules/ui/tabs';
const modules = {
    initFormstack() {
        mediator.on('page:identity:ready', (config) => {
            const attr = 'data-formstack-id';
            $(`[${attr}]`).each((el) => {
                let id = el.getAttribute(attr);
                let isEmbed = el.className.match(/\bformstack-embed\b/);

                if (isEmbed) {
                    new FormstackEmbedIframe(el, id, config).init();
                } else {
                    new Formstack(el, id, config).init();
                }
            });

            // Load old js if necessary
            $('.js-formstack-iframe').each((el) => {
                new FormstackIframe(el, config).init();
            });
        });
    },
    forgottenEmail() {
        mediator.on('page:identity:ready', (config) => {
            Identity.forgottenEmail(config);
        });
    },
    forgottenPassword() {
        mediator.on('page:identity:ready', (config) => {
            Identity.forgottenPassword(config);
        });
    },
    passwordToggle() {
        mediator.on('page:identity:ready', (config) => {
            Identity.passwordToggle(config);
        });
    },
    userAvatars() {
        mediator.on('page:identity:ready', () => {
            UserAvatars.init();
        });
    },
    validationEmail() {
        mediator.on('page:identity:ready', () => {
            ValidationEmail.init();
        });
    },

    tabs() {
        const tabs = new Tabs();
        mediator.on('page:identity:ready', () => {
            tabs.init();
        });
    },

    accountProfile() {
        const accountProfile = new AccountProfile();
        mediator.on('page:identity:ready', () => {
            accountProfile.init();
        });
    },

    savedForLater() {
        const savedForLater = new SavedForLater();
        mediator.on('page:identity:ready', () => {
            savedForLater.init();
        });
    },

    emailPreferences() {
        mediator.on('page:identity:ready', () => {
            EmailPreferences.init();
        });
    },
};

export default {
    init(config) {
        modules.initFormstack();
        modules.forgottenEmail();
        modules.forgottenPassword();
        modules.passwordToggle();
        modules.userAvatars();
        modules.validationEmail();
        modules.tabs();
        modules.accountProfile();
        modules.savedForLater();
        modules.emailPreferences();
        PublicProfile.init();

        mediator.emit('page:identity:ready', config);
    },
};
