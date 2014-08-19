var rc = Ember.Object.extend({
  action: function(name, fn) {
    this.get('controller').get('_actions')[name] = fn;
  }
});

export default rc;