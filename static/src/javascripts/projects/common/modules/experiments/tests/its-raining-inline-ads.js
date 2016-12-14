import commercialFeatures from 'common/modules/commercial/commercial-features';
export default function () {
    this.id = 'ItsRainingInlineAds';
    this.start = '2016-12-06';
    this.expiry = '2016-12-19';
    this.author = 'Regis Kuckaertz';
    this.description = 'Compare the performance of two inline ad insertion strategies';
    this.audience = 0.4;
    this.audienceOffset = 0;
    this.successMeasure = 'Advertising revenue will go through the roof without impacting viewability and click-through rate';
    this.audienceCriteria = '';
    this.dataLinkNames = '';
    this.idealOutcome = 'We see a sensible increade in ad impressions without noticeable drop in viewability and CTR';
    this.hypothesis = 'The current spacefinder rules are too restrictive and a lot of articles don\'t have a single inline MPU';
    this.showForSensitive = true;

    this.canRun = () => commercialFeatures.articleBodyAdverts;

    const success = complete => {
        complete();
    };

    this.variants = [{
        id: 'control',
        test() {},
        success: success.bind(this),
    },
        // In this variant, we leave the geo most popular component there
        // and offset ads in the right-hand column
    {
        id: 'geo',
        test() {},
        success: success.bind(this),
    },
        // Here, the geo most pop is removed and ads are offset to the right
    {
        id: 'nogeo',
        test() {},
        success: success.bind(this),
    },
        // Here, the geo most pop is removed and ads remain inline
    {
        id: 'none',
        test() {},
        success: success.bind(this),
    },
    ];
}
