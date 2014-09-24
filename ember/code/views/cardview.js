import OasisService from 'oasis/service';
import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';
import RestoreObject from '../contracts/restore/object';

import CardController from '../controllers/card';

function createStalk(parent, me, app, variety, domain, card, objectId, stateId) {
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
  else /* if we are not already an iframe */ // use Oasis
    stalk.oasisRender(variety);
  // TODO: else use envelopes
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
      objectId = this.get('yoyo.id');
      stateId = this.get('yoyo.cardState');
      canTrust = this.get('yoyo.trust');
      if (!canTrust)
        canTrust = this.get('trust');
    } else {
      console.log("card has init", this);
      console.log("card objectid", this.get('objectId'));
      renderCard = this.get('variety');
      objectId = this.get('objectId');
      stateId = this.get('cardState');
      canTrust = this.get('trust');
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
      // now attempt to lay our hands on the card variety
      renderCard = renderCard.toLowerCase();
      app.getCard(domain, renderCard, canTrust).then(function (variety) {
          createStalk(self.get('parentView'), self, app, variety, domain, renderCard, objectId, stateId);
        },
        function(e) {
          console.log("error rendering card", e);
        }
      );
    });
  }.observes('variety').on('init'),


  objectChanged: function() {
    var store = this.get('app').get('cardStore');
    var objectId = this.get('objectId');
    // TODO: this handles the case where the expanded queue has its underlying id changed
    // we want to cancel any existing subscription and start a new one on the new objectId
    if (objectId) {
      this.get('controller.stalk').contractFor('blueberries/contracts/react/ready').then(function (rc) {
        if (rc) {
          rc.cardReady(objectId, null);
        }
      });
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