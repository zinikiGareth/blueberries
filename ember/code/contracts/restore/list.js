import Contract from '../../api/contract';

var render = Contract.create({
  name: __moduleName,
  inbound:  {
  },
  outbound: {
    fromResource: {
      input: ['name'],
      delivers: {
        insertItems: { input: ['offset', 'items'] },
        deleteItems: { input: ['offset', 'count'] }
      }
    }
  }
});

export default render;