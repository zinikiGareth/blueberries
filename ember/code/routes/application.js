import RenderContext from 'blueberries/api/renderContext';

var route = Ember.Route.extend({

  renderTemplate: function() {
    // find out what the user wants to render
    var app = this.get('container').lookup('application:main');
    var root = app.get('rootcard');
    var mode = app.get('mode');

    // get/initialize the controller object
    var controller = this.get('controller');
    controller.set('rootCard', root);
    controller.set('mode', mode);

    // and show it
    this.render('topcard');
  }
});

export default route;