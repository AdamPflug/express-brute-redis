var AbstractClientStore = require('express-brute/lib/AbstractClientStore'),
    Redis = require('redis'),
    _ = require('underscore');

var RedisStore = module.exports = function (options) {
	AbstractClientStore.apply(this, arguments);
	this.options = _.extend({}, RedisStore.defaults, options);
	this.redisOptions = _(this.options).clone();
	delete this.redisOptions.prefix;
	delete this.redisOptions.client;
	delete this.redisOptions.port;
	delete this.redisOptions.host;

	if (this.options.client) {
		this.client = this.options.client;
	} else {
		this.client = RedisStore.Redis.createClient(
			this.options.port,
			this.options.host,
			this.options.redisOptions
		);
	}
};
RedisStore.prototype = Object.create(AbstractClientStore.prototype);
RedisStore.prototype.set = function (key, value, lifetime, callback) {
	lifetime = parseInt(lifetime, 10) || 0;
	var multi    = this.client.multi(),
	    redisKey = this.options.prefix+key;

	multi.set(redisKey, JSON.stringify(value));
	if (lifetime > 0) {
		multi.expire(redisKey, lifetime);
	}
	multi.exec(function (err, data) {
		typeof callback == 'function' && callback.call(this, null);
	});
};
RedisStore.prototype.get = function (key, callback) {
	this.client.get(this.options.prefix+key, function (err, data) {
		if (err) {
			typeof callback == 'function' && callback(err, null);
		} else {
			if (data) {
				data = JSON.parse(data);
				data.lastRequest = new Date(data.lastRequest);
				data.firstRequest = new Date(data.firstRequest);
			}
			typeof callback == 'function' && callback(err, data);
		}
	});
};
RedisStore.prototype.reset = function (key, callback) {
	this.client.del(this.options.prefix+key, function (err, data) {
		typeof callback == 'function' && callback.apply(this, arguments);
	});
};
RedisStore.Redis = Redis;
RedisStore.defaults = {
	prefix: '',
	port: 6379,
	host: '127.0.0.1'
};