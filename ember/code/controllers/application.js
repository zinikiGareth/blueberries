import Stalk from '../api/stalk';

var blueberryContainerController = Ember.Controller.extend({
  rootCard: null,
  request: function() {
    console.log("in card controller.request", arguments);
  }
});
blueberryContainerController.reopenClass({
  toString: function() { return "ApplicationController"; }
});

export default blueberryContainerController;