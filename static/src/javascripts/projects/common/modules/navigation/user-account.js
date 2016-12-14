import fastdom from 'fastdom';
import qwery from 'qwery';
import id from 'common/modules/identity/api';

function updateCommentLink() {
    const commentLink = qwery('.js-add-comment-activity-link')[0];

    if (commentLink) {
        const user = id.getUserFromCookie();

        commentLink.removeAttribute('hidden');
        commentLink.setAttribute('href', `https://profile.theguardian.com/user/id/${user.id}`);
    }
}

function showMyAccountIfNecessary() {
    if (id.isUserLoggedIn()) {
        const userAccountLinksContainer = qwery('.js-show-user-account-links')[0];

        if (userAccountLinksContainer) {
            fastdom.write(() => {
                userAccountLinksContainer.classList.add('user-signed-in');

                updateCommentLink();
            });
        }
    }
}


export default showMyAccountIfNecessary;
