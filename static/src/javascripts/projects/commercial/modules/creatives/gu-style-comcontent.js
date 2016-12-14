import fastdom from 'common/utils/fastdom-promise';
import $ from 'common/utils/$';
import detect from 'common/utils/detect';
import mediator from 'common/utils/mediator';
import config from 'common/utils/config';
import template from 'common/utils/template';
import svgs from 'common/views/svgs';
import GuStyle from 'commercial/modules/creatives/gustyle';
import gustyleComcontentTpl from 'text!commercial/views/creatives/gu-style-comcontent.html';
import gustyleHostedTpl from 'text!commercial/views/creatives/gu-style-hosted.html';
import merge from 'lodash/objects/merge';
import addTrackingPixel from 'commercial/modules/creatives/add-tracking-pixel';

const GustyleComcontent = function ($adSlot, params) {
    this.$adSlot = $adSlot;
    this.params = params;
};

const isDark = (hex) => {
    const colour = (hex.charAt(0) == '#') ? hex.substring(1, 7) : hex;
    const R = parseInt(colour.substring(0, 2), 16);
    const G = parseInt(colour.substring(2, 4), 16);
    const B = parseInt(colour.substring(4, 6), 16);

    const min = Math.min(Math.min(R, G), B);
    const max = Math.max(Math.max(R, G), B);
    const lightness = (min + max) / 510;
    return lightness < 0.5;
};

GustyleComcontent.prototype.create = function () {
    const brandColor = this.params.brandColor;
    const externalLinkIcon = svgs('externalLink', ['gu-external-icon']);

    const templateOptions = {
        articleContentColor: `gu-display__content-color--${this.params.articleContentColor}`,
        articleContentPosition: `gu-display__content-position--${this.params.articleContentPosition}`,
        articleHeaderFontSize: `gu-display__content-size--${this.params.articleHeaderFontSize}`,
        articleTextFontSize: `gu-display__content-size--${this.params.articleTextFontSize}`,
        brandLogoPosition: `gu-display__logo-pos--${this.params.brandLogoPosition}`,
        externalLinkIcon,
        contrastFontColour: brandColor && isDark(brandColor) ? 'gu-display__hosted-bright' : '',
        isHostedBottom: this.params.adType === 'gu-style-hosted-bottom',
    };

    const templateToLoad = this.params.adType === 'gu-style' ? gustyleComcontentTpl : gustyleHostedTpl;

    const title = this.params.articleHeaderText || 'unknown';
    const sponsor = 'Renault';
    this.params.linkTracking = `${'Labs hosted native traffic card' +
        ' | '}${config.page.edition
        } | ${config.page.section
        } | ${title
        } | ${sponsor}`;

    const markup = template(templateToLoad, {
        data: merge(this.params, templateOptions),
    });
    const gustyle = new GuStyle(this.$adSlot, this.params);

    return fastdom.write(function () {
        this.$adSlot[0].insertAdjacentHTML('beforeend', markup);

        if (this.params.trackingPixel) {
            addTrackingPixel(this.$adSlot, this.params.trackingPixel + this.params.cacheBuster);
        }
    }, this).then(gustyle.addLabel.bind(gustyle)).then(() => true);
};

export default GustyleComcontent;
