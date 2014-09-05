import Stalk from '../api/stalk';

var blueberryContainerController = Ember.Controller.extend({
  rootCard: null,
  init: function() {
    this._super();
    this.set('application', this.container.lookup('application:main'));
  },
  request: function() {
    console.log("hello from application controller.request", arguments);
    console.log("mode=", this.get('mode'));
    console.log("app =", this.get('application'));
    var oasis = this.get('application').get('oasis');
    var port = oasis.portFor(arguments[0]);
    console.log("port =", port);
    port.send(arguments[1], [].slice.call(arguments, 2));
  }
});
blueberryContainerController.reopenClass({
  toString: function() { return "ApplicationController"; }
});

export default blueberryContainerController;