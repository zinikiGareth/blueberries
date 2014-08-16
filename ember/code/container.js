import Flags from 'blueberries/flags';
import Resolver from 'resolver';

for (var i in Flags) {
  if (Flags.hasOwnProperty(i))
    Ember.ENV[i] = Flags[i];
}

var containerClass = Ember.Application.extend({
  modulePrefix: 'blueberries',
  Resolver: Resolver,
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,
  
  init: function() {
    this._super(arguments);
  }
});

export default containerClass;
