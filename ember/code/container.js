import Resolver from 'ember/resolver';
import Oasis from 'oasis';
import OasisLogger from 'oasis/logger';

import Flags from './flags';
import Patches from './patches';
import HelperInitializer from './initializers/helpers';
import ContainerInitializer from './initializers/container';
import SandboxInitializer from './initializers/sandbox';
import Variety from './support/variety';

OasisLogger.enable();

for (var i in Flags) {
  if (Flags.hasOwnProperty(i))
    Ember.ENV[i] = Flags[i];
}

var containerClass = Ember.Application.extend({
  modulePrefix: 'blueberries',
  Resolver: Resolver,
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,

  oasis: null,
  varieties: null,
  serviceDefns: null,
  serviceImpls: null,

  init: function() {
    console.log('in container init');
    this._super();
    this.figureOriginAndDomain();

    // Configure Oasis for either a container or a sandbox
    var oasis = new Oasis();
    this.set('oasis', oasis);

    // This is the set of all card definitions
    this.set('varieties', {});

    // This is the set of definitions of services we load in (results of calling contract.serviceDefn)
    this.set('serviceDefns', {});

    // When we (lazily) request the service defn at the top level, we instantiate it ONCE and store it here
    this.set('serviceImpls', {});

    // Create a promise which we can both "then" and "resolve"
    this.set('readyPromise', Ember.RSVP.defer());
    this.set('sandboxPromise', Ember.RSVP.defer());
  },

  figureOriginAndDomain: function () {
    var origin = this.get('url').origin;
    var path = this.get('url').pathname;
    var idx = path.lastIndexOf('/');
    path = path.substring(0, idx);
    idx = path.lastIndexOf('/');
    path = path.substring(0, idx);
    idx = path.lastIndexOf('/');
    var domain = path.substring(idx+1);
    path = path.substring(0, idx);
    idx = path.lastIndexOf('/');
    var context = path.substring(0, idx);
    this.set('origin', origin + context);
    this.set('domain', domain);
  },

  // When we load a new file, we need to find all the service definitions under that and "install" them
  loadServicesFrom: function(root) {
    this.installServices('', require.allUnder('', root+'/services'));
  },

  loadServicesFromNS: function(ns) {
    this.installServices(ns, require.allUnder(ns, 'services'));
  },

  installServices(ns, sdefs) {
    var map = this.get('serviceDefns');
    for (var si=0;si<sdefs.length;si++) {
      var s = sdefs[si];
      var sd = require.fromNamespace(ns, s).default;
      console.log("Creating unique service impl for", s, "from", sd, Ember.guidFor(sd), "with", sd.implementsContract);
      map[sd.serviceName] = sd;
      console.log("Created", Ember.guidFor(map[sd.serviceName]));
    }
  },

  provideService: function(name) {
    // The app should always have these.  If we don't, we may not be the app !!??
    if (!this.get('serviceImpls') || !this.get('serviceDefns'))
      debugger;

    // If we have already created the impl, return it
    if (this.get('serviceImpls')[name])
      return this.get('serviceImpls')[name];

    // OK, well if we have the defn, we can create the singleton
    if (this.get('serviceDefns')[name]) {
      var defn = this.get('serviceDefns')[name];
      var hash = {};
      hash["app"] = this;
      if (!defn.implementsContract)
        debugger;
      hash.implementsContract = defn.implementsContract;
      var impl = defn.create(hash);
      this.get('serviceImpls')[name] = impl;
      return impl;
    }

    // We don't recognize the requested service
    debugger;
    throw new Error("There is no service " + name + " in " + this.get('serviceImpls'));
  },

  // TODO: ultimately cardalog should specify the correct canTrust logic, but for testing right now it's easier from here ...
  getCard: function(domain, name, canTrust) {
    if (!domain)
      domain = this.get('domain');
    var self = this;
    var forDom = self.get('varieties')[domain];
    if (forDom && forDom[name])
      return forDom[name];
    var cname = "cards/" + domain + "/" + name;
    var trustOpt = canTrust?"?trust="+canTrust:"";
    if (!forDom)
      forDom = self.get('varieties')[domain] = {};
    return forDom[name] = Patches.ajax(self.get('origin') + "/" + cname + "/es6-amd.js"+trustOpt, "GET", {dataType: "text"}).then(function(script) {
      define.loadInNamespace(cname, script);
        
      // instantiate the card
      var card;
      try {
        card = require.fromNamespace(cname, 'card').default;
        if (Ember.typeOf(card) == 'object') {
          return card;
        }
      } catch (e) { // OK, we don't find the card; default one
        card = Ember.Object.extend({});
      }
        
      // find all the contracts and attach them to the variety
      var contracts = require.allUnder(cname, "contracts/");
      console.log(name + " supports the following contracts: " + contracts);
      var cimpls = {};
      for (var ci=0;ci<contracts.length;ci++) {
        var cn = contracts[ci];
        var cd = require.fromNamespace(cname, cn).default;
        if (cd.create)
          cimpls[cd.contractName] = cd;
      }

      // do the same for the services
      self.loadServicesFromNS(cname);
      var services = require.allUnder(cname, "services/");
      console.log(name + " offers the following services: " + services);
      var simpls = {};
      for (var si=0;si<services.length;si++) {
        var sn = services[si];
        var sd = require.fromNamespace(cname, sn).default;
        if (sd.create)
          simpls[sd.serviceName] = sd;
      }

      var variety = Variety.create({
        cardClass: card,
        contracts: cimpls,
        services: simpls
      });
      return variety;
    }).then(null, function(e)  { console.log("error", e); });
  },

  getEnvelopeFor: function(name) {
    var template = require.fromNamespace('', name+'/envelope');
    return Ember.RSVP.resolve({
      template: template
    });
  }
});

containerClass.initializer(HelperInitializer);
containerClass.initializer(ContainerInitializer);
containerClass.initializer(SandboxInitializer);

export default containerClass;
