import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';

import CardController from '../controllers/card';
import CardView from '../views/cardview';

var initializer = {
  name: 'helpers',
//  after: 'store',
  initialize: function(container, app) {

    Ember.Handlebars.helper('blueberryImage', function(value, options) {
      var escaped = Handlebars.Utils.escapeExpression(value);
      var optString = '';
      if (options.hash.class)
        optString = optString + "class='" + Handlebars.Utils.escapeExpression(options.hash.class) + "' ";
      if (options.hash.width)
        optString = optString + "width='" + Handlebars.Utils.escapeExpression(options.hash.width) + "' ";
      return new Ember.Handlebars.SafeString("<img " + optString + "src='images/" + escaped + "'>");
    });

    Ember.Handlebars.helper('card', CardView);
  }
};

export default initializer;