function copyMethods(methods, from, into) {
  if (methods) {
    for (var f in methods) {
      if (methods.hasOwnProperty(f)) { // && 'function' === typeof from[f]) {
        if (!from[f]) console.log("The method array", from, "does not implement", f);
        into[f] = from[f];
      }
    }
  }
}

var contract = Ember.Object.extend({
  cardSide: function(hash) {
    // get the name of this contract so we can store it in the objects we generate
    var name = this.get('name');
    
    // create a hash to use on create
    var initHash = {
      _toString: function() { return "cardSide/"+name; }
    };

    // copy across the "inbound" methods we are going to support
    copyMethods(this.get('inbound'), hash, initHash);
    
    // handle the "outbound" methods using "stalk.request"
    var ob = this.get('outbound');
    if (ob) {
      for (var f in ob) {
        if (ob.hasOwnProperty(f)) {
          initHash[f] = function() {
            if (arguments.length != ob[f].input.length)
              throw "Incorrect number of arguments passed to method " + f + " (expected " + ob[f].input.length + " but was passed " + arguments.length + ")";
            var args = Em.A();
            args.pushObject(name);
            args.pushObject(f);
            for (var i=0;i<arguments.length;i++)
              args.pushObject(arguments[i]);
            this.get('card.stalk.request').apply(this.get('card.stalk'), args); // and arguments based on what we see in the hash
          }
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
      child: function(name) {
        var ret = this.get('card.controller.view.cardChildren')[name];
        if (ret)
          ret = ret.get('card');
        return ret;
      },
      contract: function(child, contract) {
        var card = this.child(child);
        if (card)
          return card.contracts[contract];
        // else undefined
      },
      _toString: function() { return "cardSide/"+name; }
    };

    // copy across the "outbound" methods we are going to support in this service
    copyMethods(this.get('outbound'), hash, initHash);

    var ib = this.get('inbound');
    if (ib) {
      for (var f in ib) {
        if (ib.hasOwnProperty(f)) {
          initHash[f] = function() {
            console.log("we need to propagate " + f + " downstream", this);
            console.log(this.get('card.stalk'), ib[f]);
            if (arguments.length != ib[f].input.length)
              throw "Incorrect number of arguments passed to method " + f + " (expected " + ib[f].input.length + " but was passed " + arguments.length + ")";
            var args = Em.A();
            args.pushObject(name);
            args.pushObject(f);
            for (var i=0;i<arguments.length;i++)
              args.pushObject(arguments[i]);
            debugger;
//          this.get('card.stalk.request').apply(this.get('card.stalk'), args); // and arguments based on what we see in the hash
          }
        }
      }
    }
    
    // create the object, add the contract name & pass it back
    var ret = Ember.Object.extend(initHash); 
    ret.reopenClass({
      serviceName: name
    });
    return ret;
  },
  
  proxy: function(stalk, port) {
    var name = this.get('name');

    var inbound = {};
    for (var m in this.inbound)
      if (this.inbound.hasOwnProperty(m)) {
        // TODO: consider/respect request semantics
        inbound[m] = inboundFunction(port, name, m);
      }    
    for (var m in this.outbound)
      if (this.outbound.hasOwnProperty(m)) {
        // TODO: consider/respect request semantics
        port.on(m, outboundFunction(stalk, name, m));
      }
      
    return inbound;
  }
});

function inboundFunction(port, name, m) {
  return function() {
    var x = [m].concat([Array.prototype.slice.call(arguments, 0)]);
    port.send.apply(port, x);
  }
}

function outboundFunction(stalk, name, m) {
  return function (msg) {
    console.log("received msg", msg);
    stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

export default contract;