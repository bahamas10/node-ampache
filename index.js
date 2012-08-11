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
    xml2js = require('xml2js'),
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
  this.auth = null;
}

/**
 * Authenticate
 *
 * Ask for an auth token from the server
 *
 * @param callback {function} Call me maybe
 */
AmpacheSession.prototype.authenticate = function(callback) {
  // Make the auth data
  var self = this,
      time = Math.floor(Date.now() / 1000),
      key = crypto.createHash('sha256').update(self.pass).digest('hex'),
      passphrase = crypto.createHash('sha256').update(time + key).digest('hex'),
      values = {
        'action'    : 'handshake',
        'auth'      : passphrase,
        'timestamp' : time,
        'user'      : self.user,
        'version'   : API_VERSION,
      };

  // Send the request
  return self.call_api(values, function(err, body) {
    // If the body is present, save it
    if (body) self.auth = body;

    // Cast the date items
    ['add', 'update', 'clean'].forEach(function(key) {
      if (body && body[key]) body[key] = new Date(body[key]);
    });

    // Carly Rae back to the caller
    callback(err, body);
  });
};

/**
 * ping
 *
 * Extend a session on the server
 */
AmpacheSession.prototype.ping = function(callback) {
  return this.call_api({'action': 'ping'}, function(err, body) {
    // try to cast the date
    if (body && body.session_expire)
      body.session_expire = new Date(body.session_expire);
    callback(err, body);
  });
};

/**
 * Useful public functions to get songs/albums/artists
 */
AmpacheSession.prototype.get_artists = function(filter, callback) {
  return this._get('artists', filter, callback);
};
AmpacheSession.prototype.get_albums = function(filter, callback) {
  return this._get('albums', filter, callback);
};
AmpacheSession.prototype.get_songs = function(filter, callback) {
  return this._get('songs', filter, callback);
};
AmpacheSession.prototype.get_artist = function(filter, callback) {
  return this._get('artist', filter, callback);
};
AmpacheSession.prototype.get_album = function(filter, callback) {
  return this._get('album', filter, callback);
};
AmpacheSession.prototype.get_song = function(filter, callback) {
  return this._get('song', filter, callback);
};

/**
 * Send a request to the ampache server
 *
 * @param values   {hash}     Object of key=>values to send to the server
 * @param callback {function} Call me maybe
 */
AmpacheSession.prototype.call_api = function(values, callback) {
  values.auth = values.auth || this.auth.auth;
  callback = callback || function() {};

  // XML Parser party
  var parser = new xml2js.Parser();

  // Format the URL with values
  var url_to_hit = this.url + url.format({'query': values});
  this.debug('Making request to: %s', url_to_hit);

  // Make the request and return the request obj
  return request(url_to_hit, function(err, res, body) {
    if (err) return callback(err);
    else if (res.statusCode !== 200) return callback({'error': res.statusCode});

    // Callback the results
    parser.parseString(body, function(err, res) {
      // Check to see if post processing is required
      var action = (values.action && values.action[values.action.length - 1] === 's')
                 ? values.action.substr(0, values.action.length - 1)
                 : values.action;
      // Extract out the relevant key
      if (res && action && res[action]) res = res[action];

      // If it's an array, let's key it off of ID
      if (res.length) res = key_array(res);

      // Carly rae it to the user
      callback(err, res);
    });
  });
};

/**
 * Function to get artists/albums/songs
 */
AmpacheSession.prototype._get = function(action, filter, callback) {
  // Check if filter is supplied
  if (typeof filter === 'function') {
    callback = filter;
    filter = null;
  }

  // Create the values to send
  var values = {
    'action': action
  };
  if (filter) values.filter = filter;

  // Make the call
  return this.call_api(values, callback);
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
