import MapComponent, { MapComponentAPI, combine } from './map-component';
import layout from '../../templates/components/g-map/info-window';
import { ignoredOptions, parseOptionsAndEvents } from '../../utils/options-and-events';
import { position } from '../../utils/helpers';
import { computed, get, set } from '@ember/object';
import { resolve } from 'rsvp';


export function InfoWindowAPI(source) {
  let mapComponentAPI = MapComponentAPI(source);

  return combine(
    mapComponentAPI,
    {
      actions: {
        open: () => source.open(),
        close: () => source.close()
      }
    }
  );
}


/**
 * A wrapper for the google.maps.InfoWindow class.
 *
 * @class InfoWindow
 * @namespace GMap
 * @module ember-google-maps/components/g-map/info-window
 * @extends GMap.MapComponent
 */
export default MapComponent.extend({
  layout,

  _type: 'infoWindow',

  isOpen: false,
  _cachedIsOpen: false,

  position: computed('lat', 'lng', position),

  _optionsAndEvents: parseOptionsAndEvents([...ignoredOptions, 'isOpen', 'target', 'content']),

  _createOptions(options) {
    let newOptions = {
      content: undefined,
    };

    if (!get(this, 'target')) {
      newOptions.position = get(this, 'position');
    }

    if (get(this, 'isOpen')) {
      newOptions.content = this._getContent();
    }

    return {
      ...options,
      ...newOptions,
    };
  },

  init() {
    this._super(...arguments);

    this.publicAPI = InfoWindowAPI(this);
  },

  _addComponent(options) {
    return resolve(
      set(this, 'mapComponent', new google.maps.InfoWindow(options))
    );
  },

  _didAddComponent() {
    this._openOrClose();

    this._super(...arguments);
  },

  _updateComponent(mapComponent, options) {
    mapComponent.setOptions(options);

    this._openOrClose();
  },

  _openOrClose() {
    let isOpen = get(this, 'isOpen');
    let isOpenChanged = this._cachedIsOpen !== isOpen;

    if (isOpenChanged && isOpen) {
      this.open();
    } else if (isOpenChanged && !isOpen) {
      this.close();
    }

    set(this, '_cachedIsOpen', isOpen);
  },

  _getContent() {
    if (this.content) {
      return this.content;
    }

    let content = document.createElement('div');

    set(this, '_targetPane', content);
    set(this, 'content', content);

    return content;
  },

  open() {
    if (this.mapComponent) {
      google.maps.event.addListenerOnce(this.mapComponent, 'closeclick', () => {
        set(this, 'isOpen', false);
      });

      this.mapComponent.open(get(this, 'map'), get(this, 'target'));
    }
  },

  close() {
    if (this.mapComponent) {
      this.mapComponent.close();
    }
  }
});
