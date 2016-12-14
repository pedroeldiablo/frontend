import bean from 'bean';
import mediator from 'common/utils/mediator';
export default function() {
    if (window.matchMedia) {
        var mql = window.matchMedia('print');
        mql.addListener(function() {
            if (mql.matches) {
                mediator.emit('module:clickstream:interaction', 'print');
            }
        });
    }
};
