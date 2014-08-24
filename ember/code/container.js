import Flags from './flags';
import Patches from './patches';
import Resolver from 'resolver';
import HelperInitializer from './initializers/helpers';
import Variety from './support/variety';

for (var i in Flags) {
  if (Flags.hasOwnProperty(i))
    Ember.ENV[i] = Flags[i];
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
  },
  
  getCard: function(domain, name) {
    if (!domain)
      domain = this.get('domain');
    var self = this;
    var forDom = self.get('varieties')[domain];
    if (forDom && forDom[name])
      return Ember.RSVP.Promise.resolve(forDom[name]);
    else {
      var cname = "cards/" + domain + "/" + name;
      return Promise.all([
        // Get the HBS
        Patches.ajax(self.get('origin') + "/" + cname + "/hbs-amd.js", "GET", {dataType: "script"}),
        // Get the code
        Patches.ajax(self.get('origin') + "/" + cname + "/es6-amd.js", "GET", {dataType: "script"})
      ]).then(function(card) {
        if (!forDom)
          forDom = self.get('varieties')[domain] = {};
          
        // instantiate the card
        var card = requireModule(cname+'/card').default;
        
        // find all the contracts and attach them to the variety
        var contracts = define.allUnder(cname + "/contracts/");
        console.log(name + " supports the following contracts: " + contracts);
        var cimpls = {};
        for (var i=0;i<contracts.length;i++) {
          var n = contracts[i];
          var cd = requireModule(n).default;
          if (cd.create)
            cimpls[cd.contractName] = cd;
        }

        // do the same for the services
        var services = define.allUnder(cname + "/services/");
        console.log(name + " offers the following services: " + services);
        var simpls = {};
        for (var i=0;i<services.length;i++) {
          var n = services[i];
          var sd = requireModule(n).default;
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
