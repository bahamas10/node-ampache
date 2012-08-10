Ampache
=======

Communicate to an Ampache server using the API

Usage
-----

``` js
var AmpacheSession = require('ampache');
var conn = new AmpacheSession('user', 'pass', 'http://example.com/server/xml.server.php');
```

Examples
--------

#### Authenticate to an ampache server (assumes `conn` is set from the above usage)

``` js
conn.authenticate(function(err, body) {
  console.log(body);
});
```
yields
``` json
{
  "auth": "510b0a5f0f0e076ebab1df731acbbaeb",
  "api": "350001",
  "update": "2012-05-23T03:32:01+00:00",
  "add": "2012-08-07T09:32:17+00:00",
  "clean": "2012-08-07T09:32:29+00:00",
  "songs": "8043",
  "albums": "862",
  "artists": "372",
  "playlists": "0",
  "videos": "9"
}
```

The dates in the above examples are JavaScript `Date` objects

#### Get a list of artists

``` js
conn.get_artists(function(err, body) {
  console.log(body);
});
```
yields
``` json
{
  "391": {
    "@": {
      "id": "391"
    },
    "name": "The American Dollar",
    "tag": {
      "#": "Post-Rock",
      "@": {
        "id": "7",
        "count": ""
      }
    },
    "albums": "2",
    "songs": "24",
    "preciserating": {},
    "rating": "0"
  },
  "392": {...},
}
```

#### Query the Ampache server for a given artist id

``` js
conn.get_artist(249, function(err, body) {
  console.log(body);
});
```
yields
``` json
{
  "@": {
    "id": "249"
  },
  "name": "Lights",
  "tag": {
    "#": "Pop",
    "@": {
      "id": "11",
      "count": ""
    }
  },
  "albums": "1",
  "songs": "13",
  "preciserating": {},
  "rating": "0"
}
```

#### Ping the ampache server to prolong your session

``` js
conn.ping(function(err, body) {
  console.log(body);
});
```
yields
``` json
{
  "session_expire": "Fri, 10 Aug 2012 07:05:09 +0000",
  "server": "3.6-Alpha1-DEV",
  "version": "350001",
  "compatible": "350001"
}
```

The date in the above example is a JavaScript `Date` object

Functions
---------

### new AmpacheServer(user, pass, url, [opts])

Create a new `AmpacheServer` object.  `opts` is an object with the following keys.

`opts.debug`: `boolean` - defaults to false - whether to write debug messages to stderr

---

The following functions require an `AmpacheServer` object to run

All callbacks are optional

### conn.authenticate(callback(err, body))

Authenticate to the server, storing the auth data in the object, and return
the body

### conn.ping(callback(err, body))

Extend the session on the server by sending a keep-alive

### conn.get\_artists, conn.get\_albums, conn.get\_songs([search], callback(err, res))

Get a list of all artists/albums/songs on the server, returns a list of objects

`search` is an optional string to filter the results

### conn.get\_artist, conn.get\_album, conn.get\_song(id, callback(err, res))

Get a single artist/album/song by its ID on the server

Install
-------

    npm install ampache

Tests
-----

To test this module, you must copy the `config.json.dist` file in the tests/ folder
to `config.json`, and populate it with your Ampache server credentials.

    cp tests/config.json{.dist,}
    $EDITOR tests/config.json

And then you can run the tests manually

    npm test

License
-------

MIT Licensed
