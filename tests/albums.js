#!/usr/bin/env node
/**
 * Test authentication
 */
var conf = require('./config.json'),
    AmpacheSession = require('../');

// Make the connection object
var conn = new AmpacheSession(conf.user, conf.pass, conf.url, {'debug': true});

// Authenticate
conn.authenticate(function(err, body) {
  if (err) throw err;
  conn.get_albums(function(err, body) {
    if (err) throw err;
    console.log(JSON.stringify(body, null, 2));
  });
});
