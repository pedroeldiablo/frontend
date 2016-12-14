import bean from 'bean';
import bonzo from 'bonzo';
import fastdom from 'fastdom';
import Promise from 'Promise';
import qwery from 'qwery';
import map from 'lodash/collections/map';
import isEqual from 'lodash/objects/isEqual';
let keyPressHistory = [];
const cheatCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

const tones = map([
    'special-report',
    'live',
    'dead',
    'feature',
    'editorial',
    'comment',
    'podcast',
    'media',
    'analysis',
    'review',
    'letters',
    'external',
    'news',
], tone => `tone-${tone}--item`);

function listenForCheatCode() {
    return new Promise((resolve) => {
        const onKeyDown = (event) => {
            keyPressHistory.push(event.keyCode);

            if (isEqual(cheatCode.slice(0, keyPressHistory.length), keyPressHistory)) {
                if (keyPressHistory.length === cheatCode.length) {
                    resolve();
                    bean.off(document, 'keydown', onKeyDown);
                }
            } else {
                keyPressHistory = [];
            }
        };

        bean.on(document, 'keydown', onKeyDown);
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTone() {
    return tones[randomInt(0, tones.length - 1)];
}

function startToneDisco() {
    const $items = map(qwery('.js-fc-item'), bonzo);
    setInterval(() => {
        fastdom.write(() => {
            $items.forEach(($item) => {
                tones.forEach((tone) => {
                    $item.removeClass(tone);
                });

                $item.addClass(randomTone());
            });
        });
    }, 1000);
}

export default function () {
    listenForCheatCode().then(startToneDisco);
}
