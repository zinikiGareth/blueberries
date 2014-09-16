var controller = Ember.Controller.extend({
  init: function() {
    this._super();
    Ember.guidFor(this);
//    console.log("Creating card controller", Ember.guidFor(this));
  },
  provideService: function(name) {
    if (this.get('card.services')[name])
      return this.get('card.services')[name];

    return this.get('view.parentView.controller').provideService(name);
  },
  // we need this in order to have it copy it to _actions
  isSelected: function() {
    console.log("called isSelected");
  }.property(),
  actions: {
  }
});

export default controller;