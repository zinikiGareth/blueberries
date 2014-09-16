var controller = Ember.ArrayController.extend({
  currentSelection: null,
  currentIndex: null,
  
  init: function() {
    this._super();
    Ember.guidFor(this);
  },
  provideService: function(name) {
    return this.get('view.parentView.controller').provideService(name);
  },
  /* TODO: we can't currently select anything on arrival because it causes some kind of problem with the rendering and childViews doesn't ever get populated
  selectFirstItemAdded: function() {
    console.log("observer fired, cl =", this.get('view'));
    if (!this.get('currentIndex') && this.get('view.childViews').length > 0) {
      this.set('currentIndex', 0);
      this.set('currentSelection', this.get('model')[0].id);
      this.sendTo(this.get('view.childViews')[0], 'blueberries/contracts/react/selectFromPunnet', 'select', this.get('model')[0].id, true);
    }
  }.observes('view.childViews.[]'),
  */
  // we need this in order to have it copy it to _actions
  actions: {
    select: function(id) {
      var c = this.get('currentSelection');
      if (c === id)
        return;
      var m = this.get('model');
      for (var i=0;i<m.length;i++) {
        if (m[i].id === id) {
          var cvs = this.get('view.childViews');
          var cidx = this.get('currentIndex');
          if (cidx || cidx === 0)
            this.sendTo(cvs[cidx], 'blueberries/contracts/react/selectFromPunnet', 'select', id, false);
          this.set('currentIndex', i);
          this.set('currentSelection', id);
          this.sendTo(cvs[i], 'blueberries/contracts/react/selectFromPunnet', 'select', id, true);
          this.sendTo(this.get('view.parentView'), 'blueberries/contracts/react/childPunnetSelection', 'selected', id);
          console.log("iam =", this.get('view.called'));
          return;
        } 
      }
    }
  },
  sendTo: function(cvv, ctr, meth) {
    var contracts = cvv.get('controller.card.contracts');
    var obj = contracts[ctr];
    if (obj) {
      obj[meth].apply(obj, Array.prototype.slice.call(arguments, 3));
    }
  }
});

export default controller;