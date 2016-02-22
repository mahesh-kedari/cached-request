'use strict'
var extend = require('util')._extend;
var request = require('request');
    
//Object for storing cached values
var cachedObject = {};
// Cache-Control header values are converted into an array.
function getCachedHeadersArray(rowHeader) {
    var values = rowHeader.replace(/\s/, '').split(',');
    return values.reduce(function (acc, current) {
        var keyVal = current.split('=')
        if (keyVal.length === 1) {
            keyVal.push(true);
        } else {
            acc[keyVal[0]] = keyVal[1];
        }
        return acc;
    }, {});
};

function hasCache(uri) {
    console.log("URI: "+uri);
    var cached = !!cachedObject[uri];
    console.log("API is cached?:  "+cached); 
    return cached;
};
function isCacheable(headers) {
    if ('cache-control' in headers) {
        console.log("Caching This API");
        var cacheControl = getCachedHeadersArray(headers['cache-control'])
        if (cacheControl['max-age']) {
            var deltaSeconds = parseInt(cacheControl['max-age'], 10)
            return deltaSeconds > 0
        }
    }

    if ('expires' in headers) {
        console.log("Caching This API");
        var expiryUnixTime = new Date(headers['expires']).getTime();
        return expiryUnixTime > Date.now();
    } else if ('etag' in headers) {
        console.log("Caching This API");
        return true;
    } else if ('last-modified' in headers) {
        console.log("Caching This API");
        return true;
    }
    console.log("Not Caching This API");
    return false;
}

function responseCallback(uri, callback) {
    return function onResponse(err, res, body) {
        if (err) {
            return callback(err);
        }

        if (isCacheable(res.headers)) {
            cachedObject[uri] = res
        }

        if (res.statusCode === 304) {
            var prevCached = cachedObject[uri]
            return callback(err, prevCached, prevCached.body)
        }

        callback(err, res, body)
    }
}

module.exports = (function() {
    function requestWrapper(uri, options, callback) {
        if (typeof options === 'function' && !callback) {
            callback = options;
            options = {};
        } else if (!options) {
            options = {};
        }

        if (hasCache(uri)) {
            if (cachedObject[uri].headers.etag) {
                options.headers = extend({
                    'If-None-Match': cachedObject[uri].headers.etag
                }, options.headers || {});
            } else {
                return callback(null, cachedObject[uri], cachedObject[uri].body);
            }
        }
        request(uri, options, responseCallback(uri, callback));
    }

    ['get', 'patch', 'post', 'put', 'head', 'del'].forEach(function (method) {
        requestWrapper[method] = request[method];
    })
    return requestWrapper;
})();

module.exports.flushCache = function (uri) {
    if (uri) {
        delete cachedObject[uri];
    } else {
        cachedObject = {};
    }
}