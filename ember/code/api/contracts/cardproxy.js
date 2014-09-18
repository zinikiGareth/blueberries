function inboundProxyFunction(port, name, m) {
  return function() {
    var x = [m].concat([Array.prototype.slice.call(arguments, 0)]);
    port.send.apply(port, x);
  }
}

function handleDelivery(port, p, toWhom, delp) {
  console.log(p, delp);
  return function() {
    console.log("sending", p, arguments);
    port.send(p, [toWhom].concat(Array.prototype.slice.call(arguments, 0, delp.input.length)));
  }
}

function outboundHandleSubscription(stalk, name, m, port, delivers) {
  return function (msg) {
    console.log("received request", msg);
    var toWhom = msg[msg.length-1];
    var handler = {};
    for (var p in delivers)
      if (delivers.hasOwnProperty(p))
        handler[p] = handleDelivery(port, p, toWhom, delivers[p]);
//    msg[msg.length-1] = { insertItems: function(offset, items) { console.log("hello"); port.send("insertItems", [toWhom, offset, items]);  } };
    msg[msg.length-1] = handler;
    return stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

function outboundHandleRequest(stalk, name, m) {
  return function (msg) {
    console.log("received request", msg);
    return stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

function outboundHandlerFunction(stalk, name, m) {
  return function (msg) {
    console.log("received msg", msg);
    stalk.request.apply(stalk, [name, m].concat(msg));
  };
}

function cardProxy(stalk, port) {
  var name = this.get('name');

  console.log("proxy for card ", name);
  var inbound = {};
  for (var ibm in this.inbound)
    if (this.inbound.hasOwnProperty(ibm)) {
      // TODO: consider/respect request semantics
      inbound[ibm] = inboundProxyFunction(port, name, ibm);
    }
  for (var obm in this.outbound)
    if (this.outbound.hasOwnProperty(obm)) {
      if (this.outbound[obm].delivers)
        port.on(obm, outboundHandleSubscription(stalk, name, obm, port, this.outbound[obm].delivers));
      else if (this.outbound[obm].output)
        port.onRequest(obm, outboundHandleRequest(stalk, name, obm));
      else
        port.on(obm, outboundHandlerFunction(stalk, name, obm));
    }

  return inbound;
}

export default cardProxy;