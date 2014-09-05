import OasisService from 'oasis/service';
import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';

import CardController from '../controllers/card';

function createCard(child, app, domain, card, canTrust) {
  // now attempt to lay our hands on the card ... when we do render it into our own child
  app.getCard(domain, card, canTrust).then(function (blueberry) {
    // instantiate the card
    var stalk = Stalk.create({
      blueberryContext: null,  // not sure what this is used for, but is supposed to be the current controller
      request: function() {
        console.log(arguments);
        var parent = child.get('parentView').get('controller'); 
        parent.get('request').apply(parent, arguments);
      }
    });

    if (child.get('isTop'))
      app.set('rootStalk', stalk);
    else {
      var iamCalled = child.get('called');
      if (iamCalled) {
        child.get('parentView').bindChild(iamCalled, stalk);
      }
    }

    if (Ember.typeOf(blueberry) == 'instance') { // the card is trusted - render here
      var theCard = blueberry.get('cardClass').create({stalk: stalk, contracts: {}, services: {}});
      var controller = child.get('controller');
      controller.set('card', theCard);
      stalk.set('card', theCard);

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
        var tfn = require.fromNamespace('cards/'+domain+'/'+card, 'templates/' + renderContext.get('template'));
        child.set('template', tfn);
        child.set('model', renderContext.get('model'));
        child.rerender();
      }
    } else { // use Oasis
      var oasisCard = Ember.Object.create({stalk: stalk, contracts: {}});
      var contracts = oasisCard.get('contracts');
      stalk.set('card', oasisCard);
      
      var useOasis = blueberry;
      var capabilities = useOasis.capabilities;
      var cs = Em.A();
      for (var c in capabilities)
        if (capabilities.hasOwnProperty(c) && c != 'blueberries/contracts/render')
          cs.push(c);
      useOasis.capabilities = cs;
      console.log("building sandbox with", useOasis);
      var sandbox = app.get('oasis').createSandbox(useOasis);
      sandbox.el.style.border='0px';
      $('#'+child.get('elementId')).append(sandbox.el);
        
      // connect up the services
      for (var c in capabilities) {
        if (capabilities.hasOwnProperty(c) && c != 'blueberries/contracts/render') {
          var ci = capabilities[c];
          console.log("providing sandbox with service", c);
          sandbox.connect(c).then(function (port) {
            console.log("connected to the sandbox for", ci, "using port", port);
            contracts[c] = ci.proxy(stalk, port);
          });
        }
      }
    }
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
    this.set('cardChildren', {});
    console.log("isTop=", this.get('isTop'));
  },
  cardChanged: function() {
    console.log("Now displaying card from", this.get('from'));
    var self = this;
    Ember.run.once(function() {
      var app = self.get('app');
      var domain = self.get('domain');
      if (!domain)
        domain = app.get('domain');
      var renderCard = self.get('from');
      var canTrust = self.get('trust');
      console.log("trust " + renderCard + " =", canTrust);
      createCard(self, app, domain, renderCard.toLowerCase(), canTrust);
    });
  }.observes('from').on('init'),
  bindChild: function(name, stalk) {
    this.get('cardChildren')[name] = stalk;
  },
  classNames: ['cardView'],
  toString: function() {
    return "a card view";
  }
});

export default cardView;