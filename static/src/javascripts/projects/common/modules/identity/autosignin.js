import bonzo from 'bonzo';
import ajax from 'common/utils/ajax';
import config from 'common/utils/config';
import time from 'common/utils/time';
import id from 'common/modules/identity/api';
import FacebookAuthorizer from 'common/modules/identity/facebook-authorizer';
import Profile from 'common/modules/navigation/profile';
import Message from 'common/modules/ui/message';
import Toggles from 'common/modules/ui/toggles';

function AutoSignin() {
    var self = this;
    self.header = document.body;

    this.init = function() {

        if (id.shouldAutoSigninInUser()) {
            var appId = config.page.fbAppId,
                authorizer = new FacebookAuthorizer(appId);

            authorizer.getLoginStatus();

            authorizer.onConnected.then(function(FB, statusResponse) {
                authorizer.onUserDataLoaded.then(function(userData) {
                    if (userData.email) {
                        self.signin(statusResponse, userData.name);
                    }
                });
            });

            authorizer.onNotLoggedIn.then(function() {
                var today = time.currentDate();
                id.setNextFbCheckTime(today.setDate(today.getDate() + 1));
            });

            authorizer.onNotAuthorized.then(function() {
                var today = time.currentDate();
                id.setNextFbCheckTime(today.setMonth(today.getMonth() + 1));
            });
        }
    };

    this.signin = function(authResponse, name) {
        ajax({
            url: config.page.idWebAppUrl + '/jsapi/facebook/autosignup',
            cache: false,
            crossOrigin: true,
            type: 'jsonp',
            data: {
                signedRequest: authResponse.signedRequest,
                accessToken: authResponse.accessToken
            },
            success: function(response) {
                self.welcome(name);
                if (response.status === 'ok') {
                    var profile = new Profile({
                        url: config.page.idUrl
                    });
                    profile.init();
                    new Toggles().init();
                }
            }
        });
    };

    this.welcome = function(name) {
        var msg = '<p class="site-message__message" data-test-id="facebook-auto-sign-in-banner">' +
            'Welcome ' + name + ', you’re signed in to the Guardian using Facebook. ' +
            '<a data-link-name="fb auto : sign out" href="' + config.page.idUrl + '/signout"/>Sign out</a>.' +
            '</p>';
        new Message('fbauto', {
            important: true
        }).show(msg);
    };
}
export default AutoSignin;
