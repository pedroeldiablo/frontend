import $ from 'common/utils/$';
import bonzo from 'bonzo';
import avatarApi from 'common/modules/avatar/api';
import config from 'common/utils/config';

function init() {
    $('.user-avatar').each(avatarify);
}

function avatarify(el) {
    const container = bonzo(el);
    const updating = bonzo(bonzo.create('<div class="is-updating"></div>'));
    const avatar = bonzo(bonzo.create('<img class="user-avatar__image" alt="" />'));
    const avatarUserId = container.data('userid');
    const userId = config.user ? parseInt(config.user.id) : null;
    const ownAvatar = avatarUserId === userId;

    const updateCleanup = () => {
        updating.remove();
        avatar.appendTo(container);
    };

    container
        .removeClass('is-hidden');

    updating
        .css('display', 'block')
        .appendTo(container);

    if (ownAvatar) {
        avatarApi.getActive()
            .then((response) => {
                avatar.attr('src', response.data.avatarUrl);
            }, () => {
                avatar.attr('src', avatarApi.deterministicUrl(avatarUserId));
            })
            .always(() => {
                updateCleanup();
            });
    } else {
        avatar.attr('src', avatarApi.deterministicUrl(avatarUserId));
        updateCleanup();
    }
}

export default {
    init,
    avatarify,
};
