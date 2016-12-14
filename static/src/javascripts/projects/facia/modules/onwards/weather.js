/**
    "WEATHER"

    Whether the weather be fine,
    Or whether the weather be not,
    Whether the weather be cold,
    Or whether the weather be hot,
    We'll weather the weather
    Whatever the weather,
    Whether we like it or not!

    Author: Anonymous British
 */

import bean from 'bean';
import qwery from 'qwery';
import reportError from 'common/utils/report-error';
import $ from 'common/utils/$';
import config from 'common/utils/config';
import detect from 'common/utils/detect';
import fetchJson from 'common/utils/fetch-json';
import mediator from 'common/utils/mediator';
import template from 'common/utils/template';
import userPrefs from 'common/modules/user-prefs';
import SearchTool from 'facia/modules/onwards/search-tool';
import contains from 'lodash/collections/contains';

let $holder = null,
    searchTool = null,
    prefName = 'weather-location';

export default {
    init() {
        if (!config.switches || !config.switches.weather || !this.isNetworkFront()) {
            return false;
        }

        this.getDefaultLocation();
    },

    isNetworkFront() {
        return contains(['uk', 'us', 'au', 'international'], config.page.pageId);
    },

    /**
     * Check if user has data in local storage.
     * If yes return data from local storage else return default location data.
     *
     * @returns {object} geolocation - lat and long
     */
    getUserLocation() {
        const prefs = userPrefs.get(prefName);

        if (prefs && prefs.id) {
            return prefs;
        }
    },

    getWeatherData(url) {
        return fetchJson(url, {
            mode: 'cors',
        });
    },

    /**
     * Save user location into localStorage
     */
    saveUserLocation(location) {
        userPrefs.set(prefName, {
            id: location.id,
            city: location.city,
        });
    },

    getDefaultLocation() {
        const location = this.getUserLocation();

        if (location) {
            this.fetchWeatherData(location);
        } else {
            return this.getWeatherData(`${config.page.weatherapiurl}.json`)
                .then((response) => {
                    this.fetchWeatherData(response);
                }).catch((err) => {
                    reportError(err, {
                        feature: 'weather',
                    });
                });
        }
    },

    fetchWeatherData(location) {
        return this.getWeatherData(`${config.page.weatherapiurl}/${location.id}.json?_edition=${config.page.edition.toLowerCase()}`)
            .then((response) => {
                this.render(response, location.city);
                this.fetchForecastData(location);
            }).catch((err) => {
                reportError(err, {
                    feature: 'weather',
                });
            });
    },

    clearLocation() {
        userPrefs.remove(prefName);
        searchTool.setInputValue();
    },

    fetchForecastData(location) {
        return this.getWeatherData(`${config.page.forecastsapiurl}/${location.id}.json?_edition=${config.page.edition.toLowerCase()}`)
            .then((response) => {
                this.renderForecast(response);
            }).catch((err) => {
                reportError(err, {
                    feature: 'weather',
                });
            });
    },

    saveDeleteLocalStorage(response) {
        // After user interaction we want to store the location in localStorage
        if (response.store === 'set') {
            this.saveUserLocation(response);
            this.fetchWeatherData(response);

            // After user sent empty data we want to remove location and get the default location
        } else if (response.store === 'remove') {
            this.clearLocation();
            this.getDefaultLocation();
        }
    },

    bindEvents() {
        bean.on(document.body, 'click', '.js-toggle-forecast', (e) => {
            e.preventDefault();
            this.toggleForecast();
        });

        mediator.on('autocomplete:fetch', this.saveDeleteLocalStorage.bind(this));
    },

    toggleForecast() {
        $('.weather').toggleClass('is-expanded');
    },

    addSearch() {
        searchTool = new SearchTool({
            container: $('.js-search-tool'),
            apiUrl: config.page.locationapiurl,
        });
        searchTool.init();
    },

    render(weatherData, city) {
        this.attachToDOM(weatherData.html, city);

        this.bindEvents();
        this.addSearch();

        this.render = function (weatherData, city) {
            this.attachToDOM(weatherData.html, city);
            searchTool.bindElements($('.js-search-tool'));

            if (detect.isBreakpoint({
                max: 'phablet',
            })) {
                window.scrollTo(0, 0);
            }
        };
    },

    attachToDOM(tmpl, city) {
        $holder = $('#headlines .js-container__header');
        $('.js-weather', $holder).remove();
        $holder.append(tmpl.replace(new RegExp('<%=city%>', 'g'), city));
    },

    renderForecast(forecastData) {
        let $forecastHolder = $('.js-weather-forecast'),
            tmpl = forecastData.html;

        $forecastHolder.empty().html(tmpl);
    },
};
