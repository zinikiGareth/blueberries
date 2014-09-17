import OasisService from 'oasis/service';
import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';
import RestoreObject from '../contracts/restore/object';

import CardController from '../controllers/card';

function createCard(parent, me, app, domain, card, objectId, stateId, canTrust) {
  // now attempt to lay our hands on the card variety
  app.getCard(domain, card, canTrust).then(function (variety) {
    // instantiate the card
    var stalk = Stalk.create({
      app: app,
      view: me,
      parent: parent
    });

    if (me.get('isTop'))
      app.set('rootStalk', stalk);
    else {
      var iamCalled = me.get('called');
      if (iamCalled) {
        parent.bindChild(iamCalled, stalk);
      }
    }

    if (Ember.typeOf(variety) == 'instance') // the card is trusted - render here
      stalk.localRender(variety, domain, card, objectId, stateId);
    else // use Oasis
      stalk.oasisRender(variety);
  },
  function(e) {
    console.log("error rendering card", e);
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