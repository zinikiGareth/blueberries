import copyMethods from './copymeths';

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

function cardside(hash) {
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
}

export default cardside;