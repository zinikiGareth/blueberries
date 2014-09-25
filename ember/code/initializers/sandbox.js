import Oasis from 'oasis';

function contractFn(app, cap, m) {
  return function(msg) {
    var service = app.provideService(cap);
    if (!service) {
      return;
    } // this shouldn't be possible, but it's always good to check
    service.applyToConnections(conn => { conn[m].apply(conn, msg) });
  };
}

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
          if (cap === 'blueberryConfigChannel') {
            oasis.connect(cap).then(port => {
              port.on("setupCardRender", function(hash) {
                console.log("set up card to render with", hash);
                var readyPromise = app.get('readyPromise');
                readyPromise.resolve(hash);
              });
            });
            return;
          }
          var ctr = require.fromAny(cap).default;
          if (!ctr)
            throw new Error("Cannot load contract " + cap);
          var conn = oasis.connect(cap).then(port => {
            ports[cap] = port;
            for (var m in ctr.inbound)
              if (ctr.inbound.hasOwnProperty(m)) {
                console.log("binding method", m, "for capability", cap);
                port.on(m, contractFn(app, cap, m));
              }
            console.log("connected port", port, "for", cap);
            return port;
          }, function (ex) {
            console.log("failed to connect", cap, ex);
            debugger;
          });
          map[cap] = ctr.serviceProxy(conn);
        })(capabilities[i]);
      }
      return app.get('sandboxPromise.promise'); // this will be resolved when the card is ready
    };

    // We allow the connection to go ahead, but it will stall based on the onInit promise, which is tied to the card
    oasis.autoInitializeSandbox(Oasis.adapters);
  }
};

export default initializer;