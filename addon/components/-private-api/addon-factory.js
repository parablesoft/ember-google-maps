import Component from '@ember/component';
import layout from '../../templates/components/-private-api/addon-factory';

export default Component.extend({
  layout,
  tagName: '',

  init() {
    this._super(...arguments);

    if (!this.gMap) {
      this.gMap = {};
    }
  }
});
