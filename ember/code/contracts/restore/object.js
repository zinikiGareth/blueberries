import Contract from '../../api/contract';

var render = Contract.create({
  name: __moduleName,
  inbound: {
  },
  outbound: {
    subscribeTo:{ 
      input: ['id'],
      delivers: {
        newVersion: { input: ['obj'] }
      }
    },
    save: { input: ['obj'] }
  }
});

export default render;