import Contract from '../api/contract';

var render = Contract.create({
  name: __moduleName,
  inbound: { render: { input: ['context'], output: [] } }
});

export default render;