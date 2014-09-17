function copyMethods(contractName, dir, methods, from, into) {
  if (methods) {
    for (var f in methods) {
      if (methods.hasOwnProperty(f)) {
        if (typeof from[f] !== 'function')
          console.log("Method", f, "is not a function");
        if (from[f])
          into[f] = from[f];
        else {
          console.log("The contract " + contractName + " does not implement the " + dir + " method " + f);
          into[f] = (function(f) { return function() { console.log("Undefined method:", contractName, f); throw new Error("Undefined method: " + contractName + " " + f); }; })(f);
        }
      }
    }
  }
}

function createDirectSender(contract, meth, obf) {
  return function() {
    if (arguments.length != obf.input.length)
      throw new Error("Incorrect number of arguments passed to method " + contract+"."+meth + " (expected " + obf.input.length + " but was passed " + arguments.length + ")");
    var args = Ember.A();
    args.pushObject(contract);
    args.pushObject(meth);
    for (var i=0;i<arguments.length;i++)
      args.pushObject(arguments[i]);
    return this.get('card.stalk.request').apply(this.get('card.stalk'), args);
  }
}

function createDirectSubscriber(contract, meth, obf) {
  return function() {
    if (arguments.length != obf.input.length+1)
      throw new Error("Incorrect number of arguments passed to method " + contract+"."+meth + " (expected " + (obf.input.length+1) + " but was passed " + arguments.length + ")");
    var args = Ember.A();
    args.pushObject(contract);
    args.pushObject(meth);
    for (var i=0;i<arguments.length;i++)
      args.pushObject(arguments[i]);
    return this.get('card.stalk.request').apply(this.get('card.stalk'), args);
  }
}

// These are used in the container to proxy calls to the nested card and handle requests from it
function inboundProxyFunction(port, name, m) {
  return function() {
    var x = [m].concat([Array.prototype.slice.call(arguments, 0)]);
    port.send.apply(port, x);
  }
}

function outboundHandlerFunction(stalk, name, m) {
  return function (msg) {
    console.log("received msg", msg);
    stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

function outboundHandleRequest(stalk, name, m) {
  return function (msg) {
    console.log("received request", msg);
    return stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

function handleDelivery(port, p, toWhom, delp) {
  console.log(p, delp);
  return function() {
    console.log("sending", p, arguments);
    port.send(p, [toWhom].concat(Array.prototype.slice.call(arguments, 0, delp.input.length)));
  }
}

function outboundHandleSubscription(stalk, name, m, port, delivers) {
  return function (msg) {
    console.log("received request", msg);
    var toWhom = msg[msg.length-1];
    var handler = {};
    for (var p in delivers)
      if (delivers.hasOwnProperty(p))
        handler[p] = handleDelivery(port, p, toWhom, delivers[p]); 
//    msg[msg.length-1] = { insertItems: function(offset, items) { console.log("hello"); port.send("insertItems", [toWhom, offset, items]);  } };
    msg[msg.length-1] = handler;
    return stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

// These are used in the sandbox to proxy requests to the container and handle inbound messages
function inboundHandlerFunction(port, name, m) {
  return function() {
    console.log("Need to handle request from container", arguments);
//    var x = [m].concat([Array.prototype.slice.call(arguments, 0)]);
//    port.send.apply(port, x);
  }
}

function outboundProxyFunction(conn, name, m) {
  return function (msg) {
    console.log("Calling obf for", name, m, "with", msg);
    debugger;
    return conn.then(function(port) {
      console.log("sending msg", name, m, msg);
      debugger;
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

var contract = Ember.Object.extend({
  cardSide: function(hash) {
    // get the name of this contract so we can store it in the objects we generate
    var name = this.get('name');
    if (!name)
      throw new Error("contract " + this + " does not have a defined 'name'");
    
    // create a hash to use on create
    var initHash = {
      _toString: function() { return "cardSide/"+name; }
    };
    if (hash.init)
      initHash.init = hash.init;

    // copy across the "inbound" methods we are going to support
    copyMethods(name, 'inbound', this.get('inbound'), hash, initHash);
    
    // handle the "outbound" methods using "stalk.request"
    var ob = this.get('outbound');
    if (ob) {
      for (var f in ob) {
        if (ob.hasOwnProperty(f)) {
          var obf = ob[f];
          if (ob[f].delivers)
            initHash[f] = createDirectSubscriber(name, f, obf);
          else
            initHash[f] = createDirectSender(name, f, obf); 
        }
      }
    }
    
    // create the object, add the contract name & pass it back
    var ret = Ember.Object.extend(initHash);
    ret.reopenClass({
      contractName: name
    });
    return ret;
  },
  
  serviceSide: function(hash) {
    // get the name of this contract so we can store it in the objects we generate
    var name = this.get('name');
    // create a hash to use on create
    var initHash = {
      // get the stalk of a specified child
      child: function(name) {
        //noinspection JSPotentiallyInvalidUsageOfThis
        return this.get('stalk.controller.view.cardChildren')[name];
      },
      contract: function(child, contract) {
        var stalk = this.child(child);
        if (stalk)
          return stalk.get('contracts')[contract];
        // else undefined
      },
      _toString: function() { return "cardSide/"+name; }
    };

    if (hash.init)
      initHash.init = hash.init;

    // copy across the "outbound" methods we are going to support in this service
    copyMethods(name, 'outbound', this.get('outbound'), hash, initHash);

    var ib = this.get('inbound');
    if (ib) {
      for (var f in ib) {
        if (ib.hasOwnProperty(f)) {
          initHash[f] = (function(f) {
            return function () {
              console.log("we need to propagate " + f + " downstream", this);
              //noinspection JSPotentiallyInvalidUsageOfThis
              console.log(this.get('card.stalk'), ib[f]);
              if (arguments.length != ib[f].input.length)
                throw new Error("Incorrect number of arguments passed to method " + f + " (expected " + ib[f].input.length + " but was passed " + arguments.length + ")");
              var args = Ember.A();
              args.pushObject(name);
              args.pushObject(f);
              for (var i = 0; i < arguments.length; i++)
                args.pushObject(arguments[i]);
              debugger;
//          this.get('card.stalk.request').apply(this.get('card.stalk'), args); // and arguments based on what we see in the hash
            }
          })(f);
        }
      }
    }
    
    // create the object, add the contract name & pass it back
    var ret = Ember.Object.extend(initHash); 
    ret.reopenClass({
      serviceName: name,
      implementsContract: this
    });
    console.log("created a service impl class for", name, "with methods", initHash, "as", Ember.guidFor(ret));
    return ret;
  },
  
  // when creating a card in the containing environment which needs to be handled by Oasis,
  // we create a "proxy" card which has all "proxy" contracts which send the instructions/requests over the port
  cardProxy: function(stalk, port) {
    var name = this.get('name');

    console.log("proxy for card ", name);
    var inbound = {};
    for (var ibm in this.inbound)
      if (this.inbound.hasOwnProperty(ibm)) {
        // TODO: consider/respect request semantics
        inbound[ibm] = inboundProxyFunction(port, name, ibm);
      }    
    for (var obm in this.outbound)
      if (this.outbound.hasOwnProperty(obm)) {
        if (this.outbound[obm].delivers)
          port.on(obm, outboundHandleSubscription(stalk, name, obm, port, this.outbound[obm].delivers));
        else if (this.outbound[obm].output)
          port.onRequest(obm, outboundHandleRequest(stalk, name, obm));
        else
          port.on(obm, outboundHandlerFunction(stalk, name, obm));
      }
      
    return inbound;
  },
  
  // when creating a card in the top-level oasis container, we need to "proxy" all the available services.
  // we do this by creating a version of the service impl which uses the port
  // because of the way oasis works, port here is a promise
  serviceProxy: function(conn) {
    var name = this.get('name');

    var outbound = {};
    for (var ibm in this.inbound)
      if (this.inbound.hasOwnProperty(ibm)) {
        // TODO: consider/respect request semantics
        (function(m) {
          conn.then(function(port) { port.on(m, inboundHandlerFunction(name, m)); });
        })
      }
    for (var obm in this.outbound)
      if (this.outbound.hasOwnProperty(obm)) {
        if (this.outbound[obm].delivers)
          outbound[obm] = outboundProxySubscriber(conn, name, obm, this.outbound[obm].delivers);
        else if (this.outbound[obm].output && this.outbound[obm].output.length > 0)
          outbound[obm] = outboundProxyRequest(conn, name, obm);
        else
          outbound[obm] = outboundProxyFunction(conn, name, obm);
        console.log("Created proxy for", name, obm, "as", outbound[obm]);
      }
      
    var ret = Ember.Object.extend(outbound);
    ret.reopenClass({
      serviceName: name,
      implementsContract: this
    });
    console.log("created a service proxy for", name, "with methods", outbound, "as", Ember.guidFor(ret));
    return ret;
  }
});

export default contract;