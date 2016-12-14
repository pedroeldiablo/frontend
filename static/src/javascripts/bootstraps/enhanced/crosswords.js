import init from 'projects/common/modules/crosswords/main';
import initComments from 'projects/common/modules/crosswords/comments';
import initSeries from 'projects/common/modules/crosswords/series';
export default {
    init: function() {
        init();
        initComments();
        initSeries();
    }
};
