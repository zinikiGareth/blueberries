import Flags from 'blueberries/flags';
import Resolver from 'resolver';
import Helpers from 'blueberries/helpers'

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

Helpers.install();

export default containerClass;
