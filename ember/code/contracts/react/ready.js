import Contract from '../../api/contract';

var onReady = Contract.create({
  name: __moduleName,
  inbound:  {
    cardReady: { input: ['objectId', 'stateId'] }
  }
});

export default onReady;