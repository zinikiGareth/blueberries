import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';

import CardController from '../controllers/card';
import CardView from '../views/cardview';

function createCard(app, view, domain, card, hash) {
  // create and insert a child view now, but we will have it for all time
  var controller = new CardController({
  });
  var child = CardView.create({
    controller: controller
  });
  var childOptions = {};
  view.appendChild(child, childOptions);
      
  // now attempt to lay our hands on the card ... when we do render it into our own child
  app.getCard(domain, card).then(function (cardClass) {
    // instantiate the card
    var stalk = Stalk.create({blueberryContext: null}); // not sure what this is used for, but is supposed to be the current controller
    var theCard = cardClass.create({stalk: stalk});

        // "render" it
        var renderContext = RenderContext.create({controller: controller});
        theCard.render(renderContext);
        
        // now attach that to our view
        child.set('templateName', renderContext.get('template'));
        child.set('model', renderContext.get('model'));
        child.rerender();
  });
}

var initializer = {
  name: 'helpers',
//  after: 'store',
  initialize: function(container, app) {
    console.log("App = ", app);
    Ember.Handlebars.helper('blueberryImage', function(value, options) {
      var escaped = Handlebars.Utils.escapeExpression(value);
      var optString = '';
      if (options.hash.class)
        optString = optString + "class='" + Handlebars.Utils.escapeExpression(options.hash.class) + "' ";
      if (options.hash.width)
        optString = optString + "width='" + Handlebars.Utils.escapeExpression(options.hash.width) + "' ";
      return new Ember.Handlebars.SafeString("<img " + optString + "src='images/" + escaped + "'>");
    });

    Ember.Handlebars.helper('card', function(value, hash) {
      console.log("Showing card "+  value);
      createCard(app, hash.data.view, hash.hash.domain, value);
    });
  }
};

export default initializer;