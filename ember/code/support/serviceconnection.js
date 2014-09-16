var conn = Ember.Object.extend({

});

function createConn(ctr, impl, card) {
  "use strict";

  var hash = {};
  console.log("Implements contract", impl.implementsContract);
  if (!impl.implementsContract)
    debugger;
  for (var ib in impl.implementsContract.inbound) {
    if (impl.implementsContract.inbound.hasOwnProperty(ib)) {
      hash[ib] = function() {
        return this.get('contract').contracts[ctr][ib].apply(card, arguments);
      }
    }
  }
  for (var ob in impl.implementsContract.outbound) {
    if (impl.implementsContract.outbound.hasOwnProperty(ob)) {
      hash[ob] = function() {
        return this.get('impl').get(ob).apply(impl, arguments);
      }
    }
  }
  return Ember.Object.extend(hash);
}

export default createConn;