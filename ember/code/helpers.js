var installer = {
  install: function() {
    Ember.Handlebars.helper('blueberryImage', function(value, options) {
      var escaped = Handlebars.Utils.escapeExpression(value);
      var optString = '';
      if (options.hash.class)
        optString = optString + "class='" + Handlebars.Utils.escapeExpression(options.hash.class) + "' ";
      if (options.hash.width)
        optString = optString + "width='" + Handlebars.Utils.escapeExpression(options.hash.width) + "' ";
      return new Ember.Handlebars.SafeString("<img " + optString + "src='images/" + escaped + "'>");
    });
  }
};

export default installer;