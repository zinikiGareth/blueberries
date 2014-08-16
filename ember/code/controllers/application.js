import Stalk from 'blueberries/api/stalk';

var blueberryContainerController = Ember.Controller.extend({
  ensureLaunched: function(rootCard) {
    if (this.get('card'))
      return this.get('card');
    var stalk = Stalk.create({blueberryContext: this});
    var cardClass = requireModule(rootCard).default;
    var theCard = cardClass.create({stalk: stalk});
    this.set('card', theCard);
    return theCard;
  }
});

export default blueberryContainerController;