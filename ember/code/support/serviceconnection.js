function createConn(ctr, service, card) {
  "use strict";

  var hash = {};
  console.log("Implements contract", service.implementsContract);
  if (!service.implementsContract)
    debugger;
  for (var ib in service.implementsContract.inbound) {
    if (service.implementsContract.inbound.hasOwnProperty(ib)) {
      hash[ib] = (function(ib) {
        return function() {
          return this.get('contract').contracts[ctr][ib].apply(card, arguments);
        }
      })(ib);
    }
  }
  for (var ob in service.implementsContract.outbound) {
    if (service.implementsContract.outbound.hasOwnProperty(ob)) {
      hash[ob] = (function(ob) {
        return function() {
          return this.get('impl').get(ob).apply(service, arguments);
        }
      })(ob);
    }
  }
  return Ember.Object.extend(hash);
}

export default createConn;