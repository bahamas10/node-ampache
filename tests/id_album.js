#!/usr/bin/env node
/**
 * Test getting an album
 */
var conf = require('./config.json'),
    id = process.argv[2] || 32;
    AmpacheSession = require('../');

// Make the connection object
var conn = new AmpacheSession(conf.user, conf.pass, conf.url, {'debug': true});

// Authenticate
conn.authenticate(function(err, body) {
  if (err) throw err;
  // Get the album
  conn.get_album(id, function(err, body) {
    if (err) throw err;
    console.log(JSON.stringify(body, null, 2));
  });
});
