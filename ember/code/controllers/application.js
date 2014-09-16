import Stalk from '../api/stalk';

var blueberryContainerController = Ember.Controller.extend({
  rootCard: null,
  init: function() {
    this._super();
    this.set('application', this.container.lookup('application:main'));
  },
  provideService: function(name) {
    return this.get('application').provideService(name);
  }
});
blueberryContainerController.reopenClass({
  toString: function() { return "ApplicationController"; }
});

export default blueberryContainerController;