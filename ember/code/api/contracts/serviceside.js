import copyMethods from './copymeths';

function serviceSide(hash) {
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
}

export default serviceSide;