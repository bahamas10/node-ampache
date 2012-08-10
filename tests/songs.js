#!/usr/bin/env node
/**
 * Test getting songs
 */
var conf = require('./config.json'),
    AmpacheSession = require('../');

// Make the connection object
var conn = new AmpacheSession(conf.user, conf.pass, conf.url, {'debug': true});

// Authenticate
conn.authenticate(function(err, body) {
  if (err) throw err;
  // Get the songs
  conn.get_songs(function(err, body) {
    if (err) throw err;
    console.log(JSON.stringify(body, null, 2));
  });
});
