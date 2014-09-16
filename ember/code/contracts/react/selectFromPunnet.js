import Contract from '../../api/contract';

var selectFromPunnet = Contract.create({
  name: __moduleName,
  inbound:  {
    select: { input: ['id', 'selected'] }
  }
});

export default selectFromPunnet;