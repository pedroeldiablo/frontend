import bonzo from 'bonzo';
import detect from 'common/utils/detect';
const FootballSnaps = {
    /**
     * All the football snaps sitting in a "big" slice (if any) will take the height of their trail trails
     */
    resizeIfPresent(el) {
        if (detect.getBreakpoint() !== 'mobile' && el) {
            const $el = bonzo(el);
            $el.css('height', $el.parent().css('height'));
        }
    },
};

export default FootballSnaps;
