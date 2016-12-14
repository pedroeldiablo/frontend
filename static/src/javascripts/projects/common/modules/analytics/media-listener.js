import bean from 'bean';
import mediator from 'common/utils/mediator';
export default function () {
    if (window.matchMedia) {
        const mql = window.matchMedia('print');
        mql.addListener(() => {
            if (mql.matches) {
                mediator.emit('module:clickstream:interaction', 'print');
            }
        });
    }
}
