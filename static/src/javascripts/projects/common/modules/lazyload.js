import ajax from 'common/utils/ajax';
import steadyPage from 'common/utils/steady-page';
import bonzo from 'bonzo';
import merge from 'lodash/objects/merge';

function identity(x) {
    return x;
}

function lazyload(options) {
    /*
        Accepts these options:

        url               - string
        container         - element object
        beforeInsert      - function applied to response html before inserting it into container, optional
        success           - callback function, optional
        error             - callback function, optional
        always            - callback function, optional
        force             - boolean, default false. Reload an already-populated container
    */
    options = merge({
        success: identity,
        error: identity,
        always: identity,
        beforeInsert: identity,
        force: false,
    }, options);

    if (options.url && options.container) {
        const $container = bonzo(options.container);
        if (options.force || !$container.hasClass('lazyloaded')) {
            return ajax({
                url: options.url,
                type: 'json',
                crossOrigin: true,
            })
                .then(resp => steadyPage.insert($container[0], () => {
                    $container.html(options.beforeInsert(resp.html))
                        .addClass('lazyloaded');
                }).then(() => {
                    options.success(resp);
                }))
                .catch(options.error)
                .always(options.always);
        }
    }
}

export default lazyload;
