import RenderContext from '../api/renderContext';
import createServiceConnection from '../support/serviceconnection';

function provideStalkService(ctr, controller, cname) {
  var theService = controller.provideService(cname);
  console.log("theService", theService, "is of type", Ember.typeOf(theService));
  if (Ember.typeOf(theService) === 'class')
    debugger;
  var conn = createServiceConnection(cname, theService, ctr);
  console.log("Setting stalk service for", cname, "to be", Ember.guidFor(conn), "from defn", Ember.guidFor(theService));
  var ret = conn.create({impl: theService, contract: ctr});
  theService.addConnection(ret);
  return ret;
}

function connectContract(sandbox, contracts, serviceImpls, stalk, sn) {
  var defer = Ember.RSVP.defer();
  contracts[sn] = defer.promise;
  sandbox.connect(sn).then(function (port) {
    var si = serviceImpls[sn];
    console.log("connected to the sandbox for", sn, "using port", port);
    defer.resolve(si.implementsContract.cardProxy(stalk, port));
  }, function (ex) { defer.reject(ex); });
  return contracts[sn];
}

var StalkClass = Ember.Object.extend({
  init: function() {
    // the service implementations that can be called from here
    this.set('services', {});
    // the contracts implemented by this card
    this.set('contracts', {});
    // the services defined by this card locally
    this.set('offeredServices', {});
  },
  service: function(name) {
    return this.get('services')[name];
  },
  contractFor: function(name) {
    var contracts = this.get('contracts');
    var rc = contracts[name];
    if (rc)
      return rc;
    else
      return Ember.RSVP.resolve(null);
  },
  request: function() {
    var s = this.get('services')[arguments[0]];
    if (!s)
      throw new Error("There is no service definition for " + arguments[0]);
    return s.impl[arguments[1]].apply(s.impl, Array.prototype.slice.call(arguments, 2));
  },
  localRender: function(variety, domain, card, objectId, stateId) {
    var view = this.get('view');
    var blueberry = variety.get('cardClass').create({stalk: this});
    var services = this.get('services');
    var controller = view.get('controller');
    controller.set('stalk', this);
    controller.set('card', blueberry);
    this.set('controller', controller);
    this.set('card', blueberry);

    // create the contract objects which this card will *consume*
    var cimpls = this.get('contracts');
    var contracts = variety.get('contracts');
    for (var ctr in contracts) {
      if (contracts.hasOwnProperty(ctr)) {
        var ci = contracts[ctr].create({card: blueberry, stalk: this});
        cimpls[ctr] = Ember.RSVP.resolve(ci);
        services[ctr] = provideStalkService(ci, this.get('parent').get('controller'), ctr);
      }
    }

    // create the service objects which this card will *provide*
    var simpls = this.get('offeredServices');
    var vs = variety.get('services');
    for (var s in vs) {
      if (vs.hasOwnProperty(s)) {
        var defn = vs[s];
        simpls[s] = defn.create({card: blueberry, stalk: this, implementsContract: defn.implementsContract});
      }
    }


    // if we are at the top level, we need to wait for the "readyPromise" to resolve
    var readyPromise;
    if (view.get('isTop') && this.get('app.mode') === 'iframe') {
      // In this case, the ready contract will be called from the other side of the Oasis boundary
      readyPromise = this.get('app.readyPromise.promise');

      // Now we need to enable sandbox connection if applicable
      this.get('app.sandboxPromise.resolve')(true);
    } else {
      // OK, tell the card it's ready, if it's interested
      var currentStateP = cimpls['blueberries/contracts/restore/currentState'];
      if (currentStateP) {
        currentStateP.then(function(currentState) {
          console.log("card", domain, card, Ember.guidFor(view), "has ready contract =", currentState);
          currentState.setState(objectId, stateId);
        });
      }

      readyPromise = Ember.RSVP.resolve({ mode: view.get('mode') });
    }

    // call the render contract, if any
    var rcp = cimpls['blueberries/contracts/render'];
    if (!rcp)
      rcp = Ember.RSVP.resolve(null);

    Ember.RSVP.all([rcp, readyPromise]).then(function(arr) {
      var rc = arr[0];
      var hash = arr[1];
      var tfn = null;
      var model = null;
      if (rc) {
        var renderContext = RenderContext.create({controller: controller, mode: view.get('mode')});
        rc.render(renderContext);
        tfn = require.fromNamespace('cards/' + domain + '/' + card, 'templates/' + renderContext.get('template'));
        model = renderContext.get('model');
      } else {
        try {
          tfn = require.fromNamespace('cards/' + domain + '/' + card, 'templates/card');
          model = Ember.Object.create({});
        } catch (e) {
          // fine, nothing to render
        }
      }

      // TODO: we should also consider that the user might want to give a view back
      // handle that in a similar way to how we handle the sandbox (I think)

      // if we get a template back, render it
      if (tfn) {
        view.set('template', tfn);
        view.set('model', model);
        // TODO: currently, the template needs "{{view.model.PROP}}"; I would like it to be "{{PROP}}"
        // The code suggests setting "context" might be a good idea, but that appears to be too powerful
        // Maybe we need to set it closer to where we want to use it - i.e. somewhere down in the render/rerender chain
//        me.set('context', me);
//        console.log("rendering with controller=", me.get('controller'));
        view.rerender();
      }
    });
  },
  oasisRender: function(variety, objectId, stateId) {
    var services = this.get('services');
    var app = this.get('app');
    var view = this.get('view');
    var oasisBerry = Ember.Object.create({stalk: this});
    var contracts = this.get('contracts');
    this.set('card', oasisBerry);

    var useOasis = variety;
    var serviceDefns = app.get('serviceDefns');
    var cs = Ember.A();
    cs.push('blueberryConfigChannel');
    for (var s in serviceDefns)
      if (serviceDefns.hasOwnProperty(s))
        cs.push(s);
    useOasis.capabilities = cs;
    console.log("providing nested card with capabilities:", cs);
    var sandbox = app.get('oasis').createSandbox(useOasis);
    sandbox.wiretap(function(cap, obj) { console.log("wiretap: ", cap, obj); });
    sandbox.el.style.border='0px';
    var wdiv = $('#'+view.get('elementId'));
    wdiv.empty();
    wdiv.append(sandbox.el);

    sandbox.connect("blueberryConfigChannel").then(port => {
      port.send("setupCardRender", {mode:"yeah", size:"whatever", route: "One"});
    });
    var stalk = this;

    // connect up the services
    for (var sn in serviceDefns)
      if (serviceDefns.hasOwnProperty(sn)) {
        (function (boundSn) {
          console.log("connecting up", boundSn);
          connectContract(sandbox, contracts, serviceDefns, stalk, boundSn).then(function(ctr) {
            services[boundSn] = provideStalkService(ctr, stalk.get('parent').get('controller'), boundSn);
            console.log("now contracts=", contracts);
          });
        })(sn);
      }

    console.log("contracts =", contracts);
    this.contractFor('blueberries/contracts/restore/currentState').then(function (currentState) {
//      console.log("card", domain, card, Ember.guidFor(view), "has ready contract =", ready, 'cimpls=', cimpls);
      if (currentState) {
        currentState.setState(objectId, stateId);
      }
    })
  },
  envelopeRender: function(envelope, variety) {
    console.log("hello envelope", envelope, variety);
  }
});

export default StalkClass;