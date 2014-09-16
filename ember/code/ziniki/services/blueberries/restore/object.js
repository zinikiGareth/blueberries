import ContractDefn from 'blueberries/contracts/restore/object';

var service = ContractDefn.serviceSide({
  subscribeTo: function(id, deliverTo) {
    var store = this.get('app.cardStore');
    store.latest(id).then(function(obj) {
      deliverTo.newVersion(obj);
    });
  },
  save: function(obj) {
    console.log("save is not implemented");
    throw new Error("save is not implemented");
  }
});

export default service;