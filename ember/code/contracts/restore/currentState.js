import Contract from '../../api/contract';

var currentState = Contract.create({
  name: __moduleName,
  inbound:  {
    setState: { input: ['objectId', 'stateId'] }
  }
  // There should probably be an outbound "oh, yeah, I changed it" method
});

export default currentState;