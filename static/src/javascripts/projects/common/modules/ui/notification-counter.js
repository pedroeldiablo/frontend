import mediator from 'common/utils/mediator';


var originalPageTitle = document.title;

function NotificationCounter() {

}

NotificationCounter.prototype.init = function() {
    var self = this;
    mediator.on('modules:autoupdate:unread', function(count) {
        self.setCount(count);
    });
};

NotificationCounter.prototype.setCount = function(count) {
    if (count > 0) {
        document.title = '(' + count + ') ' + originalPageTitle;
    } else {
        this.restorePageTitle();
    }
};

NotificationCounter.prototype.restorePageTitle = function() {
    document.title = originalPageTitle;
};

export default NotificationCounter;
