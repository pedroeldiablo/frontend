import EventEmitter from 'EventEmitter';
var mediator;
var guardian = window.guardian;
var app = guardian.app = guardian.app || {};

if (app.mediator) {
    return app.mediator;
}

// a singleton instance of EventEmitter across the app
mediator = new EventEmitter();
app.mediator = mediator;

export default mediator;
