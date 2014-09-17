import RenderContext from '../api/renderContext';
import createServiceConnection from '../support/serviceconnection';

function provideStalkService(ctr, controller, cname) {
  var theService = controller.provideService(cname);
  console.log("theService", theService, "is of type", Ember.typeOf(theService));
  if (Ember.typeOf(theService) === 'class')
    debugger;
  var conn = createServiceConnection(cname, theService, ctr);
  console.log("Setting stalk service for", cname, "to be", Ember.guidFor(conn), "from defn", Ember.guidFor(theService));
  return conn.create({impl: theService, contract: ctr});
}

function connectContract(sandbox, contracts, serviceImpls, stalk, sn) {
  return sandbox.connect(sn).then(function (port) {
    var si = serviceImpls[sn];
    console.log("connected to the sandbox for", sn, "using port", port);
    contracts[sn] = si.implementsContract.cardProxy(stalk, port);
    return contracts[sn];
  });
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
        cimpls[ctr] = contracts[ctr].create({card: blueberry, stalk: this});
        services[ctr] = provideStalkService(cimpls[ctr], this.get('parent').get('controller'), ctr);
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

    // OK, tell the card it's ready, if it's interested
    var ready = cimpls['blueberries/contracts/react/ready'];
    console.log("card", domain, card, Ember.guidFor(view), "has ready contract =", ready, 'cimpls=', cimpls);
    if (ready) {
      ready.cardReady(objectId, stateId);
    }

    // call the render contract, if any
    var rc = cimpls['blueberries/contracts/render'];
    var tfn = null;
    var model = null;
    if (rc) {
      var renderContext = RenderContext.create({controller: controller, mode: view.get('mode')});
      rc.render(renderContext);
      tfn = require.fromNamespace('cards/'+domain+'/'+card, 'templates/' + renderContext.get('template'));
      model = renderContext.get('model');
    } else {
      try {
        tfn = require.fromNamespace('cards/' + domain + '/' + card, 'templates/card');
        model = Ember.Object.create({});
      } catch (e) {
        // fine, nothing to render
      }
    }

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
  },
  oasisRender: function(variety) {
    var services = this.get('services');
    var app = this.get('app');
    var view = this.get('view');
    var oasisCard = Ember.Object.create({stalk: this, contracts: {}});
    var contracts = oasisCard.get('contracts');
    this.set('card', oasisCard);

    var useOasis = variety;
    var serviceDefns = app.get('serviceDefns');
    var cs = Ember.A();
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

    var stalk = this;

    // connect up the services
    for (var sn in serviceDefns)
      if (serviceDefns.hasOwnProperty(sn)) {
        (function (boundSn) {
          connectContract(sandbox, contracts, serviceDefns, stalk, boundSn).then(function(ctr) {
            services[boundSn] = provideStalkService(ctr, stalk.get('parent').get('controller'), boundSn);
          });
        })(sn);
      }
  }
});

export default StalkClass;