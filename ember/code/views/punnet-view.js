import RenderContext from '../api/renderContext';
import Stalk from '../api/stalk';

import PunnetController from '../controllers/punnet';

var punnetView = Ember.View.extend({
// key things are template & model
// we also probably want an arrayController of some sort
  templateName: 'punnet',
  init: function() {
    this._super(arguments);
    var app = this.get('container').lookup('application:main');
    this.set('app', app);
    var controller = PunnetController.create({view:this, mode: this.get('mode')});
    this.set('controller', controller);
    
    if (this.get('card'))
      controller.set('cardType', this.get('card'));
    controller.set('model', this.get('items'));
  },
  render: function(buffer) {
    console.log("rendering", this.get('controller'));
    this._super(buffer);
  }
});

export default punnetView;