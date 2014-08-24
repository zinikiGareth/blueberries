import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';

import CardController from '../controllers/card';

function createCard(child, app, domain, card) {
  // now attempt to lay our hands on the card ... when we do render it into our own child
  app.getCard(domain, card).then(function (blueberry) {
    // instantiate the card
    var stalk = Stalk.create({
      blueberryContext: null,  // not sure what this is used for, but is supposed to be the current controller
      request: function() {
        console.log(arguments);
        var parent = child.get('parentView').get('controller'); 
        parent.get('request').apply(parent, arguments);
      }
    });
    var theCard = blueberry.get('cardClass').create({stalk: stalk, contracts: {}, services: {}});
    var controller = child.get('controller');
    controller.set('card', theCard);

    // attach the contracts
    var cimpls = theCard.get('contracts');
    for (var c in blueberry.get('contracts')) {
      if (blueberry.get('contracts').hasOwnProperty(c))
        cimpls[c] = blueberry.get('contracts')[c].create({card: theCard});
    }

    // attach the services
    var simpls = theCard.get('services');
    for (var s in blueberry.get('services')) {
      if (blueberry.get('services').hasOwnProperty(s))
        simpls[s] = blueberry.get('services')[s].create({card: theCard});
    }

    // "render" it
    var rc = cimpls['blueberries/contracts/render'];
    var renderContext = RenderContext.create({controller: controller});
    if (rc) {
      rc.render(renderContext);
    }
        
    // now attach that to our view
    child.set('templateName', renderContext.get('template'));
    child.set('model', renderContext.get('model'));
    child.rerender();
  });
}

var cardView = Ember.View.extend({
  init: function() {
    this._super(arguments);
    var controller = CardController.create({});
    this.set('controller', controller);
    controller.set('view', this);
    var app = this.get('container').lookup('application:main');
    this.set('app', app);
  },
  cardChanged: function() {
    var self = this;
    Ember.run.once(function() {
      var renderCard = self.get('from');
      createCard(self, self.get('app'), null, renderCard.toLowerCase());
    });
  }.observes('from').on('init'),
  classNames: ['cardView'],
  toString: function() {
    return "a card view";
  }
});

export default cardView;