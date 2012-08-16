#!/usr/bin/env node
/**
 * Test getting an album
 */
var conf = require('./config.json'),
    action = process.argv[2] || 'ping',
    AmpacheSession = require('../');

// Make the connection object
var conn = new AmpacheSession(conf.user, conf.pass, conf.url, {'debug': true});

// Authenticate
conn.authenticate(function(err, body) {
  if (err) throw err;
  // You make the call!
  conn.call_api({'action': action}, function(err, body) {
    if (err) throw err;
    console.log(JSON.stringify(body, null, 2));
  });
});
