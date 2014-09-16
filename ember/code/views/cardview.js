import OasisService from 'oasis/service';
import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';
import RestoreObject from '../contracts/restore/object';

import createServiceConnection from '../support/serviceconnection'
import CardController from '../controllers/card';

function createCard(parent, child, app, domain, card, objectId, stateId, canTrust) {
//   var store = app.get('cardStore');
  // now attempt to lay our hands on the card variety
  app.getCard(domain, card, canTrust).then(function (blueberry) {
    // instantiate the card
    var stalk = Stalk.create({
      blueberryContext: null,  // not sure what this is used for, but is supposed to be the current controller
      services: {},
      view: child,
      request: function() {
        var s = this.get('services')[arguments[0]];
        if (!s)
          throw new Error("There is no service definition for " + arguments[0]);
        return s.impl[arguments[1]].apply(s.impl, Array.prototype.slice.call(arguments, 2));
      }
    });

    if (child.get('isTop'))
      app.set('rootStalk', stalk);
    else {
      var iamCalled = child.get('called');
      if (iamCalled) {
        parent.bindChild(iamCalled, stalk);
      }
    }

    // This is the set of services in the stalk ...
    var services = stalk.get('services');
    if (Ember.typeOf(blueberry) == 'instance') { // the card is trusted - render here
      var theCard = blueberry.get('cardClass').create({stalk: stalk, contracts: {}, services: {}});
      var controller = child.get('controller');
      controller.set('card', theCard);
      stalk.set('card', theCard);

      // create the contract objects which this card will *consume*
      var cimpls = theCard.get('contracts');
      for (var ctr in blueberry.get('contracts')) {
        if (blueberry.get('contracts').hasOwnProperty(ctr)) {
          cimpls[ctr] = blueberry.get('contracts')[ctr].create({card: theCard});
          services[ctr] = provideStalkService(cimpls[ctr], parent.get('controller'), ctr);
        }
      }

      // create the service objects which this card will *provide*
      var simpls = theCard.get('services');
      for (var s in blueberry.get('services')) {
        if (blueberry.get('services').hasOwnProperty(s)) {
          var defn = blueberry.get('services')[s];
          simpls[s] = defn.create({card: theCard, implementsContract: defn.implementsContract});
        }
      }
      
      // OK, tell the card it's ready, if it's interested
      var ready = cimpls['blueberries/contracts/react/ready'];
      console.log("card", domain, card, Ember.guidFor(child), "has ready contract =", ready, 'cimpls=', cimpls);
      if (ready) {
        ready.cardReady(objectId, stateId);
      }
      
      // call the render contract, if any
      var rc = cimpls['blueberries/contracts/render'];
      var tfn = null
      var model = null;
      if (rc) {
        var renderContext = RenderContext.create({controller: controller, mode: child.get('mode')});
        rc.render(renderContext);
        tfn = require.fromNamespace('cards/'+domain+'/'+card, 'templates/' + renderContext.get('template'));
        model = renderContext.get('model');
      } else {
        try {
          tfn = require.fromNamespace('cards/' + domain + '/' + card, 'templates/card');
          model = Ember.Object.create({});
        } catch (e) {
          // fine, nothing to render
        } 
      }
      
      // if we get a template back, render it
      if (tfn) {
        child.set('template', tfn);
        child.set('model', model);
        // TODO: currently, the template needs "{{view.model.PROP}}"; I would like it to be "{{PROP}}"
        // The code suggests setting "context" might be a good idea, but that appears to be too powerful
        // Maybe we need to set it closer to where we want to use it - i.e. somewhere down in the render/rerender chain
//        child.set('context', child);
//        console.log("rendering with controller=", child.get('controller'));
        child.rerender();
      }
    } else { // use Oasis
      var oasisCard = Ember.Object.create({stalk: stalk, contracts: {}});
      var contracts = oasisCard.get('contracts');
      stalk.set('card', oasisCard);
      
      var useOasis = blueberry;
      var serviceDefns = app.get('serviceDefns');
      var cs = Ember.A();
      for (var s in serviceDefns)
        if (serviceDefns.hasOwnProperty(s))
          cs.push(s);
      useOasis.capabilities = cs;
      console.log("providing nested card with capabilities:", cs);
      var sandbox = app.get('oasis').createSandbox(useOasis);
      sandbox.wiretap(function(cap, obj) { console.log("wiretap: ", cap, obj); });
      sandbox.el.style.border='0px';
      $('#'+child.get('elementId')).append(sandbox.el);
        
      // connect up the services
      for (var sn in serviceDefns)
        if (serviceDefns.hasOwnProperty(sn)) {
          (function (boundSn) {
            connectContract(sandbox, contracts, serviceDefns, stalk, boundSn).then(function(ctr) {
              services[boundSn] = provideStalkService(ctr, parent.get('controller'), boundSn);
            });
          })(sn);
        }
    }
  }, function(e) { console.log("error rendering card", e); });
}

function provideStalkService(ctr, controller, cname) {
  var theService = controller.provideService(cname);
  console.log("theService", theService, "is of type", Ember.typeOf(theService));
  if (Ember.typeOf(theService) === 'class')
    debugger;
  var conn = createServiceConnection(cname, theService, ctr);
  console.log("Setting stalk service for", cname, "to be", Ember.guidFor(conn), "from defn", Ember.guidFor(theService));
  return conn.create({impl: theService, contract: ctr});
}

function connectContract(sandbox, contracts, serviceImpls, stalk, sn) {
  return sandbox.connect(sn).then(function (port) {
    var si = serviceImpls[sn];
    console.log("connected to the sandbox for", sn, "using port", port);
    contracts[sn] = si.implementsContract.cardProxy(stalk, port);
    return contracts[sn];
  });
}

var cardView = Ember.View.extend({
  init: function() {
    this._super(arguments);
    Ember.guidFor(this);

    var app = this.get('container').lookup('application:main');
    this.set('app', app);

    var controller = CardController.create({});
    this.set('controller', controller);
    controller.set('view', this);

    this.set('cardChildren', {});
  },
  
  cardChanged: function() {
    var app = this.get('app');
    var domain = this.get('domain');
    var renderCard;
    var canTrust;
    var stateId = null;
    var objectId = null;
    if (!domain)
      domain = app.get('domain');
    if (this.get('yoyo')) {
      renderCard = this.get('yoyo.card');
      canTrust = this.get('yoyo.trust');
      objectId = this.get('yoyo.id');
      stateId = this.get('yoyo.cardState');
    } else {
      console.log("card has init", this);
      console.log("card objectid", this.get('objectId'));
      renderCard = this.get('variety');
      canTrust = this.get('trust');
      objectId = this.get('objectId');
      stateId = this.get('cardState');
    }
    if (domain == null || renderCard == null) {
      console.log("Cannot display card without valid domain and card", domain, renderCard);
      if (this.get('yoyo')) console.log("yoyo =", this.get('yoyo'));
      return;
    }
    var self = this;
    self.get('classNames').pushObject('debug-'+domain+'-'+renderCard+'-'+self.get('mode'));
    Ember.run.once(function() {
//      console.log("trust " + renderCard + " =", canTrust);
      console.log(domain, renderCard, objectId);
      createCard(self.get('parentView'), self, app, domain, renderCard.toLowerCase(), objectId, stateId, canTrust);
    });
  }.observes('variety').on('init'),
  
  objectChanged: function() {
   // TODO: this handles the case where the expanded queue has its underlying id changed
   // we want to cancel any existing subscription and start a new one on the new objectId
    var store = this.get('app').get('cardStore');
    var cimpls = this.get('controller.card.contracts');
    var rc = cimpls['blueberries/contracts/react/ready'];
    var objectId = this.get('objectId');
    console.log("object changed", objectId, rc);
    if (rc && objectId) {
      rc.cardReady(objectId, null);
    }
  }.observes('objectId'),
  
  bindChild: function(name, stalk) {
    this.get('cardChildren')[name] = stalk;
  },
  classNames: ['cardView'],
  toString: function() {
    return "a card view";
  }
});

export default cardView;