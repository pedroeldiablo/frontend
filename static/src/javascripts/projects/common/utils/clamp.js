import bonzo from 'bonzo';
import bean from 'bean';

const clamp = (elem, lines, showMore) => {
    const height = elem.clientHeight;
    const lineHeight = getComputedStyle(elem).getPropertyValue('line-height');
    const maxHeight = (parseInt(lineHeight, 10) + (showMore ? 2 : 0)) * lines;
    const $fade = bonzo(bonzo.create('<span class="clamp-fade"></span>'));
    const $elem = bonzo(elem);
    let $showMore;

    if (height < maxHeight) {
        return;
    }

    $elem.css({
        maxHeight: `${maxHeight}px`,
        overflow: 'hidden',
    });

    $elem.after($fade);

    if (showMore) {
        $showMore = bonzo(bonzo.create('<span class="clamp-fade__content u-fauxlink" role="button">Read more</span>'));
        $fade.append($showMore);
        bean.on($showMore[0], 'click', () => {
            $fade.remove();
            $elem.css({
                maxHeight: 'none',
                overflow: 'auto',
            });
        });
    }
};

export default clamp; // define
