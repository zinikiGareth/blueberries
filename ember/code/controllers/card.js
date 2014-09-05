var controller = Ember.Controller.extend({
  request: function() {
    console.log("in card controller.request", arguments);
    
    var services = this.get('card.services');
    console.log('services =', services);
    if (services) {
      var theService = services[arguments[0]];
      console.log("chosen service =", theService);
      theService[arguments[1]].apply(theService, Array.prototype.slice.call(arguments, 2));
    } 
  },

  // we need this in order to have it copy it to _actions
  actions: {
  }
});

export default controller;