express-brute-redis
===================
[![Build Status](https://travis-ci.org/AdamPflug/express-brute-redis.png?branch=master)](https://travis-ci.org/AdamPflug/express-brute-redis)
[![NPM version](https://badge.fury.io/js/express-brute-redis.png)](http://badge.fury.io/js/express-brute-redis)

A Redis store for [express-brute](https://github.com/AdamPflug/express-brute)

Installation
------------
  via npm:

      $ npm install express-brute-redis

Usage
-----
``` js
var ExpressBrute = require('express-brute'),
	RedisStore = require('express-brute-redis');

var store = new RedisStore({
	host: '127.0.0.1',
	port: 6379
});
var bruteforce = new ExpressBrute(store);

app.post('/auth',
	bruteforce.prevent, // error 403 if we hit this route too often
	function (req, res, next) {
		res.send('Success!');
	}
);
```

Options
-------
- `host`         A string containing redis server host (default: '127.0.0.1')
- `port`         The port number to connect to redis on (default: 6379)
- `prefix`       An optional prefix for each redis key, in case you are sharing
                 your redis servers with something generating its own keys.
- `client`       Pre-connected redis client to use, rather than creating our own.
                 Causes all other options besides `prefix` to be ignored (default: undefined)
- ...            The rest of the options will be passed directly to the node-redis constructor.



For details see [node-redis](https://github.com/mranney/node_redis).
