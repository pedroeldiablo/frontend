import config from 'common/utils/config';
import assign from 'common/utils/assign';
import adSizes from 'common/modules/commercial/ad-sizes';
const inlineDefinition = {
    sizeMappings: {
        mobile: compile(adSizes.outOfPage, adSizes.empty, adSizes.mpu, adSizes.fluid),
        desktop: compile(adSizes.outOfPage, adSizes.empty, adSizes.mpu, adSizes.video, adSizes.fluid),
    },
};

const rightMappings = {
    mobile: compile(
        adSizes.outOfPage,
        adSizes.empty,
        adSizes.mpu,
        adSizes.halfPage,
        config.page.edition === 'US' ? adSizes.portrait : null,
        adSizes.fluid
    ),
};

const adSlotDefinitions = {
    right: {
        sizeMappings: rightMappings,
    },
    'right-sticky': {
        name: 'right',
        sizeMappings: rightMappings,
    },
    'right-small': {
        name: 'right',
        sizeMappings: {
            mobile: compile(adSizes.outOfPage, adSizes.empty, adSizes.mpu, adSizes.fluid),
        },
    },
    im: {
        label: false,
        refresh: false,
        sizeMappings: {
            mobile: compile(adSizes.outOfPage, adSizes.empty, adSizes.inlineMerchandising, adSizes.fluid),
        },
    },
    inline: inlineDefinition,
    mostpop: inlineDefinition,
    comments: inlineDefinition,
    'top-above-nav': {
        sizeMappings: {
            mobile: compile(
                adSizes.outOfPage,
                adSizes.empty,
                adSizes.mpu,
                adSizes.fluid250,
                adSizes.fabric,
                adSizes.fluid
            ),
        },
    },
};

function compile(size1) {
    let result = size1;
    for (let i = 1; i < arguments.length; i++) {
        if (arguments[i]) {
            result += `|${arguments[i]}`;
        }
    }
    return result;
}

function createAdSlotElement(name, attrs, classes) {
    const adSlot = document.createElement('div');
    adSlot.id = `dfp-ad--${name}`;
    adSlot.className = `js-ad-slot ad-slot ad-slot--dfp ${classes.join(' ')}`;
    adSlot.setAttribute('data-link-name', `ad slot ${name}`);
    adSlot.setAttribute('data-test-id', `ad-slot-${name}`);
    adSlot.setAttribute('data-name', name);
    Object.keys(attrs).forEach((attr) => {
        adSlot.setAttribute(attr, attrs[attr]);
    });
    return adSlot;
}

export default function (name, slotTypes, series, keywords, slotTarget) {
    let slotName = slotTarget ? slotTarget : name;
    let attributes = {};
    let definition;
    let classes = [];

    definition = adSlotDefinitions[slotName] || adSlotDefinitions.inline;
    name = definition.name || name;

    assign(attributes, definition.sizeMappings);

    if (definition.label === false) {
        attributes.label = 'false';
    }

    if (definition.refresh === false) {
        attributes.refresh = 'false';
    }

    if (slotTarget) {
        attributes['slot-target'] = slotTarget;
    }

    if (series) {
        attributes.series = series;
    }

    if (keywords) {
        attributes.keywords = keywords;
    }

    if (slotTypes) {
        classes = (Array.isArray(slotTypes) ? slotTypes : [slotTypes]).map(type => `ad-slot--${type}`);
    }

    classes.push(`ad-slot--${name}`);

    return createAdSlotElement(
        name,
        Object.keys(attributes).reduce((result, key) => {
            result[`data-${key}`] = attributes[key];
            return result;
        }, {}),
        classes
    );
}
