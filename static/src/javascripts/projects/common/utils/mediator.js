import EventEmitter from 'EventEmitter';

const guardian = window.guardian;
const app = guardian.app = guardian.app || {};

// a singleton instance of EventEmitter across the app
app.mediator = app.mediator || new EventEmitter();

export default app.mediator;
