import bean from 'bean';
import $ from 'common/utils/$';
import storage from 'common/utils/storage';

function init() {
    const $form = $('.js-subscriber-number-form')[0];

    if (!$form) {
        return;
    }

    bean.on($form, 'submit', (event) => {
        submitForm($form, event);
    });
}

function onCorrectNumber($numberInput, $correctNumberInfo, $incorrectNumberInfo) {
    storage.local.set('gu.subscriber', true);
    $correctNumberInfo.removeClass('u-h');
    $incorrectNumberInfo.addClass('u-h');
    $numberInput.addClass('correct');
    $numberInput.removeClass('incorrect');
}

function onIncorrectNumber($numberInput, $correctNumberInfo, $incorrectNumberInfo) {
    storage.local.set('gu.subscriber', false);
    $incorrectNumberInfo.removeClass('u-h');
    $correctNumberInfo.addClass('u-h');
    $numberInput.addClass('incorrect');
    $numberInput.removeClass('correct');
}

function submitForm($form, event) {
    event.preventDefault();

    const $numberInput = $('.input-number', $form);
    const numberVal = $numberInput.val();
    const isSubscriber = /^(?=\S{8,11}$)(00|GA|A-S)\S+/.test(numberVal);
    const $correctNumberInfo = $('.js-subscriber-number-correct');
    const $incorrectNumberInfo = $('.js-subscriber-number-incorrect');

    if (isSubscriber) {
        onCorrectNumber($numberInput, $correctNumberInfo, $incorrectNumberInfo);
    } else {
        onIncorrectNumber($numberInput, $correctNumberInfo, $incorrectNumberInfo);
    }
}

export default function () {
    init();
}
