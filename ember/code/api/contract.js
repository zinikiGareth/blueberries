function copyMethods(methods, from, into) {
  if (methods) {
    for (var f in methods) {
      if (methods.hasOwnProperty(f)) { // && 'function' === typeof from[f]) {
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
            console.log("we need to propagate " + f + " upstream", this);
            console.log(this.get('card.stalk'), ob[f]);
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
      _toString: function() { return "cardSide/"+name; }
    };

    // copy across the "outbound" methods we are going to support in this service
    copyMethods(this.get('outbound'), hash, initHash);

    // TODO: offer the "inbound" methods as something this service can request somebody else to do
    
    // create the object, add the contract name & pass it back
    var ret = Ember.Object.extend(initHash); 
    ret.reopenClass({
      serviceName: name
    });
    return ret;
  }
});

export default contract;