import bean from 'bean';
import fastdom from 'fastdom';
import $ from 'common/utils/$';
import template from 'common/utils/template';
import userPrefs from 'common/modules/user-prefs';
import svgs from 'common/views/svgs';
import surveySimpleTemplate from 'text!commercial/views/survey/survey-simple.html';
import uniq from 'lodash/arrays/uniq';
const surveySimple = function (config) {
    this.config = config || {};
    this.id = this.config.id;
    this.prefs = 'overlay-messages';
    this.shouldClosePermanently = this.config.shouldClosePermanently || false;
    this.bannerTmpl = template(surveySimpleTemplate, {
        header: this.config.header,
        paragraph1: this.config.paragraph1,
        paragraph2: this.config.paragraph2,
        paragraph3: this.config.paragraph3,
        showCloseBtn: this.config.showCloseBtn,
        arrowWhiteRight: svgs('arrowWhiteRight'),
        marque36icon: svgs('marque36icon'),
        crossIcon: svgs('crossIcon'),
        paidContent: svgs('paidContent'),
    });
};

surveySimple.prototype.attach = function () {
    if (!this.hasSeen()) {
        fastdom.write(() => {
            $(document.body).append(this.bannerTmpl);

            if (this.config.showCloseBtn) {
                bean.on(document, 'click', $('.js-survey-close'), this.handleClick.bind(this));
            }
        });
    }
};

surveySimple.prototype.handleClick = function () {
    $('.js-survey-overlay').addClass('u-h');
    if (this.shouldClosePermanently) {
        this.closePermanently();
    }
};

surveySimple.prototype.hasSeen = function () {
    const messageStates = userPrefs.get(this.prefs);
    return messageStates && messageStates.indexOf(this.id) > -1;
};

surveySimple.prototype.closePermanently = function () {
    const messageStates = userPrefs.get(this.prefs) || [];
    messageStates.push(this.id);
    userPrefs.set(this.prefs, uniq(messageStates));
};

surveySimple.prototype.show = () => {
    fastdom.write(() => {
        $('.js-survey-overlay').removeClass('u-h');
    });
};

export default surveySimple;
