import RenderContext from 'blueberries/api/renderContext';

var route = Ember.Route.extend({

  renderTemplate: function() {
    // find out what the user wants to render
    var app = this.get('container').lookup('application:main');
    var root = app.get('rootcard');

    // get/initialize the controller object
    var controller = this.get('controller');
    controller.set('rootCard', root);

    // and show it
    this.render('topcard');
  }
});

export default route;