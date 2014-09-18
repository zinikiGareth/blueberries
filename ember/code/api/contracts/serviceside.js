import copyMethods from './copymeths';

function serviceSide(hash) {
  // get the name of this contract so we can store it in the objects we generate
  var name = this.get('name');
  // create a hash to use on create
  var initHash = {
    init: function() {
      this._super();
      this.set('connections', []);
      if (hash.init)
        hash.init.apply(this);
    },
    // TODO: presumably we need to be able to remove them as well ...
    addConnection: function(conn) {
      this.get('connections').pushObject(conn);
    },
    // get the stalk of a specified child
    child: function(name) {
      debugger;
      //noinspection JSPotentiallyInvalidUsageOfThis
      return this.get('stalk.controller.view.cardChildren')[name];
    },
    applyToConnections: function(meth) {
      this.get('connections').forEach(function (item, index) {
        meth(item.get('contract'));
      });
    },
    _toString: function() { return "cardSide/"+name; }
  };

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