import qwery from 'qwery';
import config from 'common/utils/config';
import CommentBlocker from 'common/modules/experiments/tests/utils/comment-blocker';
import identity from 'common/modules/identity/api';
const seriesIds = [
    'fashion/series/sali-hughes-beauty',
    'politics/series/politics-live-with-andrew-sparrow',
    'books/series/tips-links-and-suggestions-books',
    'music/series/readersrecommend',
    'technology/series/chatterbox',
    'sport/series/county-cricket-live-blog',
    'sport/series/talking-horses',
    'books/series/poemoftheweek',
    'football/series/you-are-the-ref',
    'lifeandstyle/series/how-to-eat',
    'commentisfree/series/you-tell-us',
    'football/series/footballweekly',
    'australia-news/series/politics-live-with-katharine-murphy',
    'crosswords/series/quick',
    'crosswords/series/quiptic',
    'crosswords/series/cryptic,',
    'crosswords/series/speedy',
];

const blogIds = [
    'lifeandstyle/the-running-blog',
    'crosswords/crossword-blog',
    'politics/blog',
    'environment/bike-blog',
    'technology/askjack',
    'commentisfree/series/guardian-comment-cartoon',
];

const dontRunOnAuthor = 'First Dog on the Moon';

function doesNotContain(values, toTest) {
    return values.indexOf(toTest) === -1;
}

export default function () {
    this.id = 'ParticipationDiscussionTest';
    this.start = '2016-05-26';
    this.expiry = '2016-07-25';
    this.author = 'Nathaniel Bennett';
    this.description = 'Hide comments for a percentage of users to determine what effect it has on their dwell time and loyalty ';
    this.audience = 0.1;
    this.audienceOffset = 0.5;
    this.successMeasure = 'We want to guage how valuable comments actually are to us';
    this.audienceCriteria = 'All users';
    this.dataLinkNames = '';
    this.idealOutcome = 'DO we want to turn comments up or down';

    this.canRun = function () {
        const testAuthor = config.page.author || '';
        const canRunOnBlog = doesNotContain(blogIds, config.page.blogIds || '');
        const canRunOnSeries = doesNotContain(seriesIds, config.page.seriesId || '');
        const notLoggedIn = !identity.isUserLoggedIn();
        return testAuthor !== dontRunOnAuthor && canRunOnBlog && canRunOnSeries && notLoggedIn;
    };

    this.variants = [{
        id: 'variant-1',
        test() {
            let shortUrlSlug = (config.page.shortUrl || '').replace('http://gu.com/p/', ''),
                hide = CommentBlocker.hideComments(shortUrlSlug);

            if (config.page.isContent && hide) {
                qwery('.js-comments').forEach((c) => {
                    c.classList.add('discussion--hidden');
                });
                qwery('.js-commentcount').forEach((c) => {
                    c.classList.add('commentcount2--hidden');
                });
            }
        },
    }, {
        id: 'control',
        test() {},
    }];
}
