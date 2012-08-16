/**
 * Ampache JS
 *
 * Library to interface with Ampache in Node.js
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 */

var crypto = require('crypto'),
    http = require('http'),
    url = require('url'),
    util = require('util'),
    request = require('request'),
    autocast = require('autocast'),
    xml2js = require('xml2js'),
    MAX_OFFSET = 5000,
    API_VERSION = 350001;

// Exports
module.exports = AmpacheSession;

/**
 * AmpacheSession object
 *
 * @param user {string} The username
 * @param pass {string} The password
 * @param url  {string} The url to hit the api
 * @param opts {obj}    An array of options
 */
function AmpacheSession(user, pass, url, opts) {
  this.user = user;
  this.pass = pass;
  this.url = url;
  this.opts = opts || {};
  this.auth = {};
}

/**
 * Authenticate
 *
 * Ask for an auth token from the server
 *
 * @param cb {function} Call me maybe
 */
AmpacheSession.prototype.authenticate = function(cb) {
  // Make the auth data
  var self = this,
      time = Math.floor(Date.now() / 1000),
      key = sha(self.pass);
      passphrase = sha(time + key);
      values = {
        'action'    : 'handshake',
        'auth'      : passphrase,
        'timestamp' : time,
        'user'      : self.user,
        'version'   : API_VERSION,
      };

  // Send the request
  return self.call_api(values, function(err, body) {
    if (err) return cb(err);

    self.auth = body;

    // Cast the date items
    ['add', 'update', 'clean'].forEach(function(key) {
      if (self.auth && self.auth[key]) self.auth[key] = new Date(self.auth[key]);
    });

    cb(null, self.auth);
  });
};

/**
 * ping
 *
 * Extend a session on the server
 *
 * @param cb {function} Call me maybe
 */
AmpacheSession.prototype.ping = function(cb) {
  return this.call_api({'action': 'ping'}, function(err, body) {
    if (err) return cb(err);

    // try to cast the date
    if (body && body.session_expire)
      body.session_expire = new Date(body.session_expire);

    cb(null, body);
  });
};

/**
 * Useful public functions to get songs/albums/artists
 */
AmpacheSession.prototype.get_artists = function(filter, cb) {
  return this._get('artists', filter, cb);
};
AmpacheSession.prototype.get_albums = function(filter, cb) {
  return this._get('albums', filter, cb);
};
AmpacheSession.prototype.get_songs = function(filter, cb) {
  return this._get('songs', filter, cb);
};
AmpacheSession.prototype.get_artist = function(filter, cb) {
  return this._get('artist', filter, cb);
};
AmpacheSession.prototype.get_album = function(filter, cb) {
  return this._get('album', filter, cb);
};
AmpacheSession.prototype.get_song = function(filter, cb) {
  return this._get('song', filter, cb);
};

/**
 * Send a request to the ampache server
 *
 * @param values   {hash}     Object of key=>values to send to the server
 * @param cb       {function} Call me maybe
 */
AmpacheSession.prototype.call_api = function(values, cb) {
  if (!values.action) return cb(new Error('Action must be specified'));
  cb = cb || function() {};
  values.auth = values.auth || this.auth.auth;
  var self = this;

  // XML Parser party
  var parser = new xml2js.Parser();

  // Format the URL with values
  var url_to_hit = this.url + url.format({'query': values});
  self.debug('Making request to: %s', url_to_hit);

  // Make the request and return the request obj
  return request(url_to_hit, function(err, res, body) {
    if (err) return cb(err);
    self.debug('Request complete to: %s [%d]', url_to_hit, res.statusCode);
    if (res.statusCode !== 200) return cb(new Error('Status code: ' + res.statusCode));
    if (!body) return cb(new Error('Empty body received'));

    parser.parseString(body, function(err, res) {
      if (err) return cb(err);

      // Check to see if post processing is required
      var action = (values.action && values.action[values.action.length - 1] === 's')
                 ? values.action.substr(0, values.action.length - 1)
                 : values.action;

      if (res && action && res[action]) res = res[action];
      if (res.length) res = key_array(res);
      autocast_obj(res);

      cb(null, res);
    });
  });
};

/**
 * helper function to get artists/albums/songs
 */
AmpacheSession.prototype._get = function(action, filter, cb) {
  if (typeof filter === 'function') {
    cb = filter;
    filter = null;
  }

  // Create the values to send
  var values = {
    'action': action
  };
  if (filter) values.filter = filter;

  // Check to see if an offset is needed
  if (this.auth[action] && this.auth[action] > MAX_OFFSET) {
    var total_count = Math.ceil(this.auth[action] / MAX_OFFSET),
        count = 0,
        d = {};
    this.debug('Offset needed: %d calls required', total_count);
    // Loop the offsets (i=offset needed)
    var errors = [];
    for (var i = 0; i < total_count; i++) {
      values.offset = i * MAX_OFFSET;
      this.call_api(values, function(err, body) {
        if (err) {
          errors.push(err);
        } else {
          Object.keys(body).forEach(function(key) {
            d[key] = body[key];
          });
        }
        if (++count >= total_count)
          return cb((errors.length === 0) ? null : errors[0], d);
      });
    }
  } else {
    // just make the call, no offset needed
    return this.call_api(values, cb);
  }
}

/**
 * Debug statements for AmpacheJS
 */
AmpacheSession.prototype.debug = function() {
  if (this.opts.debug)
    process.stderr.write('AmpacheJS :: ' + util.format.apply(this, arguments) + '\n');
};

/**
 * Internal function to turn an array into an object
 * keyed off of ['@']['id']
 */
function key_array(array) {
  var d = {};
  for (var i in array) {
    d[array[i]['@']['id']] = array[i];
  }
  return d;
}

/**
 * Autocast an object
 */
function autocast_obj(obj) {
  if (!obj) return;
  Object.keys(obj).forEach(function(key) {
    if (obj && obj[key]) obj[key] = autocast(obj[key]);
  });
}

/**
 * return a sha256 string
 */
function sha(s, alg) {
  return crypto.createHash(alg || 'sha256').update(s).digest('hex');
}
