import Contract from '../../api/contract';

var selectChild = Contract.create({
  name: __moduleName,
  inbound:  {
    selected: { input: ['id'] }
  }
});

export default selectChild;