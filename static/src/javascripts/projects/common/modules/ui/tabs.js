import $ from 'common/utils/$';
import bean from 'bean';
import bonzo from 'bonzo';

/*
    expects the following HTML structure

    <div class="tabs">
        <ol class="tabs__container js-tabs" role="tablist">
            <li id="foo-tab" class="tabs__tab tabs__tab--selected" role="tab" aria-selected="true" aria-controls="foo"><a href="#foo">Foo</a></li>
            <li id="bar-tab" class="tabs__tab" role="tab" aria-selected="false" aria-controls="bar"><a href="#bar">Bar</a></li>
        </ol>

        <div class="tabs__content">
             <div class="tabs__pane" id="foo" role="tabpanel" aria-labelledby="foo-tab">foo</div>
             <div class="tabs__pane modern-hidden" id="bar" role="tabpanel" aria-labelledby="bar-tab">bar</div>
        </div>
    </div>
*/

const Tabs = function () {
    const view = {

        showTab(container, clickedTab, originalEvent) {
            let classes = 'tabs__tab--selected tone-colour tone-accent-border';

            let // find the active tab in the set. returns an array of 1 item, hence [0]
            currentTab = $('.tabs__tab--selected a', container)[0];

            let // trim the leading # and find the matching panel element
            paneToShow = container.querySelector(`#${clickedTab.getAttribute('href').substring(1)}`);

            let paneToHide = container.querySelector(`#${currentTab.getAttribute('href').substring(1)}`);

            // show hide stuff
            bonzo(currentTab.parentNode).removeClass(classes);
            bonzo(clickedTab.parentNode).addClass(classes);
            bonzo(currentTab.parentNode).attr('aria-selected', false);
            bonzo(clickedTab.parentNode).attr('aria-selected', true);
            bonzo(paneToHide).hide();
            bonzo(paneToShow).removeClass('modern-hidden').show().focus();

            // only do this if we know the href was a tab ID, not a URL
            originalEvent.preventDefault();
        },
    };

    this.init = () => {
        Array.prototype.forEach.call(document.body.querySelectorAll('.tabs'), (container) => {
            let tabSet = $('.js-tabs', container)[0];
            let vPos = 0;
            let vScroll = 0;

            if (tabSet) {
                if (tabSet.getAttribute('data-is-bound') === true) {
                    return false;
                }

                vPos = bonzo(tabSet).offset().top;

                bean.add(tabSet, 'click', (e) => {
                    const targetElm = e.target;
                    // verify they clicked an <a> element
                    if (targetElm.nodeName.toLowerCase() === 'a') {
                        view.showTab(container, targetElm, e);
                        if (vScroll > vPos) {
                            window.scrollTo(0, vPos);
                        }
                    }
                });

                tabSet.setAttribute('data-is-bound', true);
            }
        });
    };
};

export default Tabs;
