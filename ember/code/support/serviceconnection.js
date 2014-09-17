function createConn(ctr, impl, card) {
  "use strict";

  var hash = {};
  console.log("Implements contract", impl.implementsContract);
  if (!impl.implementsContract)
    debugger;
  for (var ib in impl.implementsContract.inbound) {
    if (impl.implementsContract.inbound.hasOwnProperty(ib)) {
      hash[ib] = (function(ib) {
        return function() {
          return this.get('contract').contracts[ctr][ib].apply(card, arguments);
        }
      })(ib);
    }
  }
  for (var ob in impl.implementsContract.outbound) {
    if (impl.implementsContract.outbound.hasOwnProperty(ob)) {
      hash[ob] = (function(ob) {
        return function() {
          return this.get('impl').get(ob).apply(impl, arguments);
        }
      })(ob);
    }
  }
  return Ember.Object.extend(hash);
}

export default createConn;