function copyMethods(contractName, dir, methods, from, into) {
  if (methods) {
    for (var f in methods) {
      if (methods.hasOwnProperty(f)) {
        if (typeof from[f] !== 'function')
          console.log("Method", f, "is not a function");
        if (from[f])
          into[f] = from[f];
        else {
          console.log("The contract " + contractName + " does not implement the " + dir + " method " + f);
          into[f] = (function(f) { return function() { console.log("Undefined method:", contractName, f); throw new Error("Undefined method: " + contractName + " " + f); }; })(f);
        }
      }
    }
  }
}

export default copyMethods;