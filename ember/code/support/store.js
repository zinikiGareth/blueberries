// Ember Data does not meet my needs in a number of ways
// But most importantly, it seems to really be an ORM and I don't need that
// What we do want are:
//   (a) seamless notification handling
//   (b) the ability to store multiple versions of the same object
//   (c) the ability to store multiple envelopes representing the same object as well as the "real" thing
// However, stealing some portion of its adapter &c seems a good idea; let's use Zinc/JSONAPI where we can
// We also want to use collision-resistant-data-structures where possible

function ContentItem(id) {
  this.id = id;
  this.max = -1;
  this.roots = {};
  
  this.setRoot = function(vers, hash) {
    this.roots[vers] = hash;
    if (vers > this.max)
      this.max = vers;
  }
}

var store = Ember.Object.extend({
  // the content map holds id=>"everything we know", which can be quite complicated and is delegated
  contents: {},
  
  push: function(obj) {
    // TODO: the objects SHOULD include the version #
    console.log("want to push", obj.id, obj.version, obj);
    if (!obj.version) obj.version = 1;
    var ci = this.contents[obj.id];
    if (!ci)
      ci = this.contents[obj.id] = new ContentItem(obj.id);
    ci.setRoot(obj.version, obj);
  },
  
  latest: function(id) {
    if (!this.contents[id])
      throw new Error("There is no object in the store for id " + id); // we need to return this to the card somehow - a "noObject" method? - an error on the promise we didn't create?
    var c = this.contents[id];
    return Ember.RSVP.Promise.resolve(c.roots[c.max]);
  }
});

export default store;