import ContractDefn from 'blueberries/contracts/restore/list';
import Zinc from 'zinc';

var service = ContractDefn.serviceSide({
  init: function() {
    console.log("Creating service impl for list contract", Ember.guidFor(this), Zinc);
    // TODO: we need to get hold of this URL from somewhere ...
    var reqP = Zinc.newRequestor("http://localhost:10080/ziniki/adapterZinc").then(function(req) {
      var r = req.invoke('login');
      r.setOption('login', 'gareth');
      r.setOption('password', 'powell');
      r.send();
      
      // TODO: this needs to be configured somewhere
      console.log("Mapping package name chaddy");
      req.invoke('package/chaddy')
        .setOption('zinikiName', 'com.helpfulsidekick.omt.personal')
        .setOption('version', 1)
        .send();
      
      return req;
    });
    this.set('requestor', reqP);
  },
  // TODO: I think there also wants to be an "onCreateProxy" method here to create the necessary setup 
  fromResource: function(resource/*, params? */, deliverTo) {
    var store = this.get('app.cardStore');
    console.log("Hey, fromResource got called for", resource);
    this.get('requestor').then(function (req) {
      console.log("We have requestor", req);

      var cnt = 0;
      // We are somewhat hamstrung by the fact that we don't have the correct list semantics across the zinc protocol, either
      var m = req.subscribe(resource, function (r) {
        var pl = r['chaddy.Queue'];
        
        // Put the items in the store first
        for (var pi=0;pi<pl.length;pi++)
          store.push(pl[pi]);
        
        // Now notify the contract
        deliverTo.insertItems(cnt, pl);
        cnt += pl.length;
      });
      // TODO: use params?
      m.send();
      return ret;
    });
  }
});

export default service;