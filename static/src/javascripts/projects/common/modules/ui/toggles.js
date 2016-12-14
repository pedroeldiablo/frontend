import bean from 'bean';
import bonzo from 'bonzo';
import $ from 'common/utils/$';
import mediator from 'common/utils/mediator';
import contains from 'lodash/collections/contains';

const Toggles = function (parent) {
    let self = this;
    let controls;
    let doNotReset = ['popup--search'];
    let readyClass = 'js-toggle-ready';
    let isSignedIn = $('.js-profile-nav').hasClass('is-signed-in');
    let component = parent || document.body;

    this.init = () => {
        controls = Array.prototype.slice.call(component.querySelectorAll('[data-toggle]'));

        controls.forEach((control) => {
            if (!bonzo(control).hasClass(readyClass)) {
                const target = self.getTarget(component, control);

                if (target && !(!isSignedIn && control.getAttribute('data-toggle-signed-in') === 'true')) {
                    control.toggleTarget = target;
                    bonzo(control).addClass(readyClass);
                    bean.add(control, 'click', (e) => {
                        e.preventDefault();
                        self.toggle(control, controls);
                    });
                }
            }
        });
    };

    this.reset = omitEl => {
        controls.filter(control => !(omitEl === control || contains(doNotReset, $(control).attr('data-toggle')))).map(self.close);
    };

    mediator.on('module:clickstream:click', (clickSpec) => {
        self.reset(clickSpec ? clickSpec.target : null);
    });
};

Toggles.prototype.toggle = function (control, controls) {
    const self = this;

    controls.forEach((c) => {
        if (c === control) {
            self[bonzo(c).hasClass('is-active') ? 'close' : 'open'](c);
        } else {
            self.close(c);
        }
    });
};

Toggles.prototype.getTarget = (parent, control) => {
    const targetClass = bonzo(control).data('toggle');
    if (targetClass) {
        return parent.querySelector(`.${targetClass}`);
    }
};

Toggles.prototype.open = c => {
    bonzo(c).addClass('is-active');
    bonzo(c.toggleTarget).removeClass('is-off');
};

Toggles.prototype.close = c => {
    bonzo(c).removeClass('is-active');
    bonzo(c.toggleTarget).addClass('is-off');
};

export default Toggles;
