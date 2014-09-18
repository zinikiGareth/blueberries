import cardSide from './contracts/cardside';
import serviceSide from './contracts/serviceside';
import cardProxy from './contracts/cardproxy';
import serviceProxy from './contracts/serviceproxy';

var contract = Ember.Object.extend({
  // This method is called by card-defining code to implement the "card" side of the contract,
  // passing in the hash of methods that represent the implementation
  cardSide: cardSide,

  // This method is called by service-defining code to provide an actual "implementation" of the
  // service
  serviceSide: serviceSide,

  // This method is called by the container when it needs to "proxy" access to
  // this contract as implemented in a sandbox
  cardProxy: cardProxy,

  // This method is called by the system when setting up a sandbox to
  // provide "proxy" endpoints for the sandbox cards to call up to
  serviceProxy: serviceProxy
});

export default contract;