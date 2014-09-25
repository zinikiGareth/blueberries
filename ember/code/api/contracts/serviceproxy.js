// This appears to be duplicative of "contractFn" in the sandbox initializer
// The difference is that seems to be implemented :-)
function inboundHandlerFunction(port, name, m) {
  return function() {
    console.log("Need to handle request from container", arguments);
    debugger;
//    var x = [m].concat([Array.prototype.slice.call(arguments, 0)]);
//    port.send.apply(port, x);
  }
}

function cardSideProxySubscriptionFn(allDeliveries, p, delp) {
  return function(args) {
    var dude = allDeliveries[args[0]];
    dude[p].apply(dude, args.slice(1, delp.input.length+1));
  }
}

function outboundProxySubscriber(conn, name, m, delivers) {
  var allDeliveries = [];
  conn.then(function(port) {
    for (var p in delivers)
      if (delivers.hasOwnProperty(p))
        port.on(p, cardSideProxySubscriptionFn(allDeliveries, p, delivers[p]));
  });
  return function () {
    var deliverTo = arguments[arguments.length-1];
    var msg = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    msg[arguments.length-1] = allDeliveries.length;
    allDeliveries[allDeliveries.length] = deliverTo;
    return conn.then(function(port) {
      console.log("sending subscription request", name, m, msg);
      return port.send(m, msg);
    });
  };
}

function outboundProxyRequest(conn, name, m) {
  return function (msg) {
    return conn.then(function(port) {
      console.log("sending request", name, m, msg);
      return port.request(m, msg);
    });
  };
}

function outboundProxyFunction(conn, name, m) {
  return function (msg) {
    return conn.then(function(port) {
      console.log("sending msg", name, m, msg);
      return port.send(m, msg);
    });
  };
}

function serviceProxy(conn) {
  var name = this.get('name');

  var methods = {
    init: function() {
      this._super();
      this.set('connections', []);
    },
    // TODO: presumably we need to be able to remove them as well ...
    addConnection: function(conn) {
      this.get('connections').pushObject(conn);
    },
    applyToConnections: function(meth) {
      this.get('connections').forEach(function (item, index) {
        meth(item.get('contract'));
      });
    }
  };

  for (var ibm in this.inbound)
    if (this.inbound.hasOwnProperty(ibm)) {
      // TODO: consider/respect request semantics
      (function(m) {
        conn.then(function(port) { port.on(m, inboundHandlerFunction(name, m)); });
      })();
    }
  for (var obm in this.outbound)
    if (this.outbound.hasOwnProperty(obm)) {
      if (this.outbound[obm].delivers)
        methods[obm] = outboundProxySubscriber(conn, name, obm, this.outbound[obm].delivers);
      else if (this.outbound[obm].output && this.outbound[obm].output.length > 0)
        methods[obm] = outboundProxyRequest(conn, name, obm);
      else
        methods[obm] = outboundProxyFunction(conn, name, obm);
      console.log("Created proxy for", name, obm, "as", methods[obm]);
    }

  var ret = Ember.Object.extend(methods);
  ret.reopenClass({
    serviceName: name,
    implementsContract: this
  });
  console.log("created a service proxy for", name, "with methods", methods, "as", Ember.guidFor(ret));
  return ret;
}

export default serviceProxy;