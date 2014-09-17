import Store from '../support/store';

var initializer = {
  name: 'container',
//  after: 'store',
  initialize: function(container, app) {
    "use strict";
    if (app.get('mode') === 'iframe') {
      console.log("Mode is iframe, container init returning");
      return;
    }
    console.log("initializing main container");

    // Figure the available service implementations based on what's loaded
    app.loadServicesFrom("blueberries");
    app.loadServicesFrom("blueberries/ziniki");
    app.set('cardStore', Store.create({}));
  }
};

export default initializer;