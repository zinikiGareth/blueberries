import Resolver from 'ember/resolver';
import Oasis from 'oasis';
import OasisLogger from 'oasis/logger';

import Flags from './flags';
import Patches from './patches';
import HelperInitializer from './initializers/helpers';
import Variety from './support/variety';

OasisLogger.enable();

for (var i in Flags) {
  if (Flags.hasOwnProperty(i))
    Ember.ENV[i] = Flags[i];
}

function contractFn(app, cap, m) {
  return function(msg) {
    var c = app.get('rootStalk.card.contracts')[cap];
    c[m].apply(c[m], msg);
  };
}

var containerClass = Ember.Application.extend({
  modulePrefix: 'blueberries',
  Resolver: Resolver,
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,
  
  varieties: {},
  
  init: function() {
    this._super(arguments);
    var origin = this.get('url').origin;
    var path = this.get('url').pathname;
    var idx = path.lastIndexOf('/');
    path = path.substring(0, idx);
    var idx = path.lastIndexOf('/');
    path = path.substring(0, idx);
    var idx = path.lastIndexOf('/');
    var domain = path.substring(idx+1);
    path = path.substring(0, idx);
    var idx = path.lastIndexOf('/');
    var context = path.substring(0, idx);
    this.set('origin', origin + context);
    this.set('domain', domain);
    
    // TODO: should perhaps put all this in an initializer with deferReadiness enabled
    var oasis = new Oasis();
    this.set('oasis', oasis);
    console.log('container.mode=', this.get('mode'));
    var app = this;
    var capabilities = this.get('capabilities');
    if (capabilities) {
      // This is the path we take if we are an Oasis Card
      oasis.autoInitializeSandbox(Oasis.adapters);
      var ports = {};
      this.set('ports', ports);      
      for (var i=0;i<capabilities.length;i++) {
        var cap = capabilities[i];
        console.log("connecting ", cap);
        var ctr = requireModule(cap).default;
        if (!ctr)
          throw "Cannot load contract " + cap;
        oasis.connect(cap).then(port => {
          ports[cap] = port;
          for (var m in ctr.inbound)
            port.on(m, contractFn(app, cap, m));
          console.log("connected port", port);
        }, function(ex) {
          console.log("failed", ex);
        });
      }
    }
  },
  
  // TODO: ultimately cardalog should specify the correct canTrust logic, but for testing right now it's easier from here ...
  getCard: function(domain, name, canTrust) {
    if (!domain)
      domain = this.get('domain');
    var self = this;
    var forDom = self.get('varieties')[domain];
    if (forDom && forDom[name])
      return Ember.RSVP.Promise.resolve(forDom[name]);
    else {
      var cname = "cards/" + domain + "/" + name;
      var trustOpt = canTrust?"?trust="+canTrust:"";
      return Patches.ajax(self.get('origin') + "/" + cname + "/es6-amd.js"+trustOpt, "GET", {dataType: "text"}).then(function(script) {
        if (!forDom)
          forDom = self.get('varieties')[domain] = {};
        
        define.loadInNamespace(cname, script);
        
        // instantiate the card
        var card = require.fromNamespace(cname, 'card').default;
        if (Ember.typeOf(card) == 'object') {
          forDom[name] = card;
          return card;
        }
        
        // find all the contracts and attach them to the variety
        var contracts = require.allUnder(cname, "contracts/");
        console.log(name + " supports the following contracts: " + contracts);
        var cimpls = {};
        for (var i=0;i<contracts.length;i++) {
          var n = contracts[i];
          var cd = require.fromNamespace(cname, n).default;
          if (cd.create)
            cimpls[cd.contractName] = cd;
        }

        // do the same for the services
        var services = require.allUnder(cname, "services/");
        console.log(name + " offers the following services: " + services);
        var simpls = {};
        for (var i=0;i<services.length;i++) {
          var n = services[i];
          var sd = require.fromNamespace(cname, n).default;
          if (sd.create)
            simpls[sd.serviceName] = sd;
        }

        var variety = Variety.create({
          cardClass: card,
          contracts: cimpls,
          services: simpls
        }); 
        forDom[name] = variety;
        return forDom[name];
      }).then(null, function(e)  { console.log("error", e); });
    }
  }
});

containerClass.initializer(HelperInitializer);

export default containerClass;
