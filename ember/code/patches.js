var patches = {
  // I copied this from Ember Data
  // I think it should be more centrally available, but doesn't seem to be
      ajax: function(url, type, hash) {
        var self = this;

        return new Ember.RSVP.Promise(function(resolve, reject) {
          hash = self.ajaxOptions(url, type, hash);

          hash.success = function(json) {
            Ember.run(null, resolve, json);
          };

          hash.error = function(jqXHR, textStatus, errorThrown) {
          console.log("failed to load", url);
            Ember.run(null, reject, self.ajaxError(jqXHR));
          };

          Ember.$.ajax(hash);
        }, "patches#ajax " + type + " to " + url);
      },
      ajaxOptions: function(url, type, hash) {
        hash = hash || {};
        hash.url = url;
        hash.type = type;
        // hash.dataType = 'json';
        hash.context = this;

        if (hash.data && type !== 'GET') {
          hash.contentType = 'application/json; charset=utf-8';
          hash.data = JSON.stringify(hash.data);
        }

        var headers = Ember.get(this, 'headers');
        if (headers !== undefined) {
          hash.beforeSend = function (xhr) {
            forEach.call(Ember.keys(headers), function(key) {
              xhr.setRequestHeader(key, headers[key]);
            });
          };
        }

        return hash;
      },
      ajaxError: function(jqXHR) {
        if (jqXHR && typeof jqXHR === 'object') {
          jqXHR.then = null;
        }

        return jqXHR;
      }
}

export default patches;