import mediator from 'common/utils/mediator';


const originalPageTitle = document.title;

function NotificationCounter() {

}

NotificationCounter.prototype.init = function () {
    const self = this;
    mediator.on('modules:autoupdate:unread', (count) => {
        self.setCount(count);
    });
};

NotificationCounter.prototype.setCount = function (count) {
    if (count > 0) {
        document.title = `(${count}) ${originalPageTitle}`;
    } else {
        this.restorePageTitle();
    }
};

NotificationCounter.prototype.restorePageTitle = () => {
    document.title = originalPageTitle;
};

export default NotificationCounter;
