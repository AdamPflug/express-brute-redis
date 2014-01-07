var _ = require('underscore'),
    async = require('async');

var RedisClientMock = function (options) {
	this.data = {};
	_.bindAll(this, 'set', 'get', 'expire', 'del', 'multi');
};
RedisClientMock.prototype.set = function (key, value, callback) {
	if (!this.data[key]) {
		this.data[key] = {};
	}
	this.data[key].value = value;

	typeof callback == 'function' && callback(null);
};
RedisClientMock.prototype.expire = function (key, lifetime, callback) {
	if (this.data[key] && this.data[key].timeout) {
		clearTimeout(this.data[key].timeout);
	}
	this.data[key].timeout = setTimeout(_.bind(function () {
		delete this.data[key];
	}, this), 1000*lifetime);
	typeof callback == 'function' && callback(null);
};
RedisClientMock.prototype.get = function (key, callback) {
	typeof callback == 'function' && callback(null, this.data[key] && this.data[key].value);
};
RedisClientMock.prototype.del = function (key, callback) {
	if (this.data[key] && this.data[key].timeout) {
		clearTimeout(this.data[key].timeout);
	}
	delete this.data[key];
	typeof callback == 'function' && callback(null);
};
RedisClientMock.prototype.multi = function (key, callback) {
	return new RedisMultiMock(this);
};

var RedisMultiMock = function (client) {
	_.bindAll(this, 'set', 'get', 'expire', 'del', 'exec', '_createCallback');
	this.client = client;
	this.responses = [];
	this.err = false;
	this.queue = async.queue(function (task, callback) {
		task(callback);
	}, 1);
	var pause = _.bind(function (callback) {
		this.runQueue = callback;
	},this);
	this.queue.push(pause);
};
RedisMultiMock.prototype = {
	set: function (key, value) {
		this.queue.push(_.bind(function (callback) {
			this.client.set.call(this.client, key, value, this._createCallback(callback));
		}, this));
	},
	get: function (key) {
		this.queue.push(_.bind(function (callback) {
			this.client.get.call(this.client, key, this._createCallback(callback));
		}, this));
	},
	del: function (key) {
		this.queue.push(_.bind(function (callback) {
			this.client.del.call(this.client, key, this._createCallback(callback));
		}, this));
	},
	expire: function (key, lifetime) {
		this.queue.push(_.bind(function (callback) {
			this.client.expire.call(this.client, key, lifetime, this._createCallback(callback));
		}, this));
	},
	exec: function (callback) {
		this.queue.drain = _.bind(function () {
			callback(this.err, this.responses);
		}, this);
		setTimeout(_.bind(function () { this.runQueue(); }, this));
	},
	_createCallback: function (callback) {
		return _.bind(function (err, response) {
			this.responses.push(response);
			this.err || err;
			callback(err, response);
		},this);
	}
};


module.exports = {
	createClient: function (port, host, options) {
		return new RedisClientMock(options);
	}
};