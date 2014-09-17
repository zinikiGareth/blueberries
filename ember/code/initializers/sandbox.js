import Oasis from 'oasis';

var initializer = {
  name: 'sandbox',
//  after: 'store',
  initialize: function(container, app) {
    "use strict";
    if (app.get('mode') !== 'iframe') {
      console.log("Not an iframe, returning");
      return;
    }
    console.log("initializing iframe");

    var oasis = app.get('oasis');
    var map = app.get('serviceDefns');
    var ports = {};
    app.set('ports', ports);

    // set up the handler for the provided capabilities
    oasis.onInit = function(capabilities) {
      for (var i=0;i<capabilities.length;i++) {
        (function(cap) {
          console.log("connecting ", cap);
          var ctr = require.fromAny(cap).default;
          if (!ctr)
            throw new Error("Cannot load contract " + cap);
          var conn = oasis.connect(cap).then(port => {
            ports[cap] = port;
            for (var m in ctr.inbound)
              if (ctr.inbound.hasOwnProperty(m))
                port.on(m, contractFn(app, cap, m));
            console.log("connected port", port, "for", cap);
            return port;
          }, function (ex) {
            console.log("failed to connect", cap, ex);
            debugger;
          });
          map[cap] = ctr.serviceProxy(conn);
        })(capabilities[i]);
      }
      return Ember.RSVP.resolve(true);
    };

    // and connect everything up
    oasis.autoInitializeSandbox(Oasis.adapters);
  }
};

export default initializer;