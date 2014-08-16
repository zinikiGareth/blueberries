import RenderContext from 'blueberries/api/renderContext';

var route = Ember.Route.extend({
  renderTemplate: function() {
    var app = this.get('container').lookup('application:main');
    var root = app.get('rootcard');
    var card = this.get('controller').ensureLaunched(root);

    var renderContext = RenderContext.create({});
    card.render(renderContext);
    this.render(renderContext.get('template'), renderContext.get('model'));
  }
});

export default route;