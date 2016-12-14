import addEventListener from 'common/utils/add-event-listener';
import assign from 'common/utils/assign';
import closest from 'common/utils/closest';
import fastdom from 'common/utils/fastdom-promise';
import messenger from 'commercial/modules/messenger';
messenger.register('background', (specs, ret, iframe) => setBackground(specs, closest(iframe, '.js-ad-slot')));

export default setBackground;

function setBackground(specs, adSlot) {
    if (!specs ||
        !('backgroundImage' in specs) ||
        !('backgroundRepeat' in specs) ||
        !('backgroundPosition' in specs) ||
        !('scrollType' in specs)
    ) {
        return null;
    }

    // Create an element to hold the background image
    const background = document.createElement('div');
    background.className = `creative__background creative__background--${specs.scrollType}`;
    assign(background.style, specs);

    // Wrap the background image in a DIV for positioning. Also, we give
    // this DIV a background colour if it is provided. This is because
    // if we set the background colour in the creative itself, the background
    // image won't be visible (think z-indexed layers)
    const backgroundParent = document.createElement('div');
    backgroundParent.className = 'creative__background-parent';
    if ('backgroundColour' in specs) {
        backgroundParent.style.backgroundColor = specs.backgroundColour;
    }
    backgroundParent.appendChild(background);

    if (specs.scrollType === 'fixed') {
        return fastdom.write(() => {
            adSlot.insertBefore(backgroundParent, adSlot.firstChild);
        });
    } else {
        let updateQueued = false;

        return fastdom.write(() => {
            adSlot.insertBefore(backgroundParent, adSlot.firstChild);
        })
            .then(() => {
                addEventListener(window, 'scroll', onScroll, {
                    passive: true,
                });
                onScroll();

                function onScroll() {
                    if (!updateQueued) {
                        updateQueued = true;
                        fastdom.read(() => {
                            updateQueued = false;
                            const rect = backgroundParent.getBoundingClientRect();
                            const dy = (0.3 * rect.top | 0) + 20;

                            // We update the style in a read batch because the DIV
                            // has been promoted to its own layer and is also
                            // strictly self-contained. Also, without doing that
                            // the animation is extremely jittery.
                            background.style.backgroundPositionY = `${dy}%`;
                        });
                    }
                }
            });
    }
}
