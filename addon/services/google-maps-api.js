import Service from '@ember/service';
import { computedPromise, promisify } from '../utils/helpers';
import { get } from '@ember/object';
import { Promise, reject, resolve } from 'rsvp';
import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { bind } from '@ember/runloop';
import runloopifyGoogleMaps from '../utils/runloopify-google-maps';


/**
 * @class GoogleMapsApi
 * @extends Ember.Service
 * @module ember-google-maps/services/google-maps-api
 * @public
 */
export default Service.extend({
  /**
   * @method google
   * @readOnly
   * @return {Ember.ObjectProxy}
   */
  google: computedPromise(function() {
    return this._getApi();
  }).readOnly(),

  /**
   * @method directionsService
   * @readOnly
   * @return {Ember.ObjectProxy}
   */
  directionsService: computedPromise(function() {
    return get(this, 'google').then(() => new google.maps.DirectionsService());
  }).readOnly(),

  /**
   * By default, this returns the Google Maps URL created at build time. You can
   * use this hook to build the URL at runtime instead.
   *
   * Optionally, you can return a promise that resolves with the URL. This
   * allows you to use external data when building the URL. For example, you
   * could fetch the database record for the current user for localisation
   * purposes.
   *
   * @method buildGoogleMapsUrl
   * @public
   * @param  {Object} config The ember-google-maps configuration.
   * @return {(string|Promise<string>)} The URL to the Google Maps API.
   */
  buildGoogleMapsUrl(config) {
		if(config['src'])
			return config['src'];
		else{
			return this._buildGoogleMapsUrl(config)
		}
  },


  _buildGoogleMapsUrl(config = {}) {
    let {
      baseUrl = '//maps.googleapis.com/maps/api/js',
      channel,
      client,
      key,
      language,
      libraries,
      protocol,
      region,
      version,
      mapIds,
    } = config;

    if (!key && !client) {
      // Since we allow configuring the URL at runtime, we don't throw an error
      // here.
      return '';
    }

    if (key && client) {
      this.warn('You must specify either a Google Maps API key or a Google Maps Premium Plan Client ID, but not both. Learn more: https://ember-google-maps.sandydoo.me/docs/getting-started');
    }

    if (channel && !client) {
      this.warn('The Google Maps API channel parameter is only available when using a client ID, not when using an API key. Learn more: https://ember-google-maps.sandydoo.me/docs/getting-started');
    }

    let src = baseUrl,
        params = [];

    if (version) {
      params.push('v=' + encodeURIComponent(version));
    }

    if (client) {
      params.push('client=' + encodeURIComponent(client));
    }

    if (channel) {
      params.push('channel=' + encodeURIComponent(channel));
    }

    if (libraries && libraries.length) {
      params.push('libraries=' + encodeURIComponent(libraries.join(',')));
    }

    if (region) {
      params.push('region=' + encodeURIComponent(region));
    }

    if (language) {
      params.push('language=' + encodeURIComponent(language));
    }

    if (key) {
      params.push('key=' + encodeURIComponent(key));
    }

    if (mapIds) {
      params.push('map_ids=' + encodeURIComponent(mapIds));
    }

    if (protocol) {
      src = protocol + ':' + src;
    }

    src += '?' + params.join('&');

    return src;
  },

  /**
   * Get the configuration for ember-google-maps set in environment.js. This
   * should contain your API key and any other options you set.
   *
   * @method _getConfig
   * @private
   * @return {Object}
   */
  _getConfig() {
    return getOwner(this).resolveRegistration('config:environment')['ember-google-maps'];
  },

  /**
   * Return or load the Google Maps API.
   *
   * @method _getApi
   * @private
   * @return {Promise<object>}
   */
  _getApi() {
    if (typeof document === 'undefined') { return reject(); }

    let google = window.google;
    if (google && google.maps) { return resolve(google); }

    let config = this._getConfig();

    return promisify(this.buildGoogleMapsUrl(config))
      .then(this._loadAndInitApi);
  },

  _loadAndInitApi(src) {
    assert(`
ember-google-maps: You tried to load the Google Maps API, but the source URL was empty. \
Perhaps you forgot to specify the API key? \
Learn more: https://ember-google-maps.sandydoo.me/docs/getting-started`,
      src
    );

    return new Promise((resolve, reject) => {
      window.initGoogleMap = bind(() => {
        runloopifyGoogleMaps();
        resolve(window.google);
      });

      let s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.onerror = (error) => reject(error);
      // Insert into DOM to avoid CORS problems
      document.body.appendChild(s);

      // Load map
      s.src = `${src}&callback=initGoogleMap`;
    });
  }
});
