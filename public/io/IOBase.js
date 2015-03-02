'use strict';

// GENERIC BASE IO CLASS
// returns class

var core = require('wunderbits.core');
var WBClass = core.WBClass;
var WBDeferred = core.WBDeferred;
var assert = core.lib.assert;
var extend = core.lib.extend;

var AjaxTransport = require('./io/AjaxTransport');
var PlatformHeaders = require('../helpers/PlatformHeaders');

var _super = WBClass.prototype;

var absoluteUrlRegexp = /^(https?:)?\/\//;
var wlURLRegexp = /^(https?:)?\/\/\w+\.wunderlist.com\//;

module.exports = WBClass.extend({

  'initialize': function (options) {

    var self = this;
    self.config = options.config;

    AjaxTransport.maxRequests = self.config.maxHttpRequests || 5;

    _super.initialize.apply(self, arguments);

    self.io = AjaxTransport.ajax.bind(AjaxTransport);

    // create io verbs on class
    var crudOps = ['delete', 'get', 'patch', 'post', 'put'];
    for (var i=0, len=crudOps.length; i<len; i++) {
      self.defineVerb(crudOps[i]);
    }

    // compile routes for faster lookup
    self.routes = self.compileRoutes(self.routes, self.tokens);
    self.authFreeRoutes = self.compileRoutes(self.authFreeRoutes, self.tokens);
  },

  'compileRoutes': function (routes, tokens) {

    var self = this;

    // no routes defined
    if (!routes) {
      return undefined;
    }

    function markTokens (rule) {
      return rule.replace(/\{\{(\w+)\}\}/g, function (match, token) {
        return tokens[token];
      });
    }

    var compiled = {};
    for (var service in routes) {
      var rules = routes[service];
      rules = rules.map(markTokens);
      var regexp = new RegExp('^/(' + rules.join('|') + ')(\\?|$)');
      var host = self.config[service].host;
      compiled[host] = regexp;
    }

    return compiled;
  },

  // Change relative URLs to point to the correct host
  // extend is subclass
  'resolveUrl': function (url) {

    var self = this, resolved;

    // Don't touch absolute urls
    if (absoluteUrlRegexp.test(url)) {
      return url;
    }

    // if a known route
    if (self.routes) {
      resolved = self.resolveRoute(url);
    }

    // just make the url relative to the current domain
    if (!resolved) {
      resolved = self.normalizeUrl(url);
    }

    return resolved;
  },

  // resolve known routes to absolute urls
  'resolveRoute': function (route) {

    var self = this;
    for (var host in self.routes) {
      var regexp = self.routes[host];
      if (regexp.test(route)) {
        return host + route;
      }
    }
  },

  // make relative URLs absolute
  'normalizeUrl': function (url) {
    var location = global.location;
    return location.protocol + '//' + location.host + url;
  },

  // add/remove/augment headers
  // extend in subclass
  'extendHeaders': function (headers, url) {

    var self = this;

    var isAbsoluteURL = absoluteUrlRegexp.test(url);
    var isWLUrl = !isAbsoluteURL || wlURLRegexp.test(url);

    // url is used by api extendHeaders
    headers = headers || {};

    // Also add custom headers needed for client-identification
    if (isWLUrl) {
      extend(headers, PlatformHeaders.headers);
    }

    // skip auth headers for certain urls
    if (self.authFreeRoutes) {
      for (var host in self.authFreeRoutes) {
        var regexp = self.authFreeRoutes[host];
        if (regexp.test(url)) {
          return headers;
        }
      }
    }

    // Add Auth token for relative urls that need auth
    // Don't modify any existing auth headers
    if (isWLUrl && !headers.Authorization) {
      self.setAuthorization(headers, url);
    }

    return headers;
  },

  'setAuthorization': function () {
    // base class, does nothing
  },

  // Create functions for http verbs
  'defineVerb': function (type) {

    var self = this;

    self.io[type] = function (url, data, headers, timeout, context) {

      assert(url, 'need a url for ajax calls');

      headers = headers || {};
      headers = self.extendHeaders(headers, url);

      var deferred = new WBDeferred();
      var promise = deferred.promise();

      // resolve the url to an absolute url
      url = self.resolveUrl(url);

      // format the data
      if (typeof data === 'object') {
        // convert to query params for get requests
        if (type === 'get') {
          var params = [], key;
          for (key in data) {
            params.push(key + '=' + encodeURIComponent(data[key]));
          }
          params.length && (url = url + '?' + params.join('&'));
          data = undefined;
        }
        // for other methods, Serialize the data as json
        else {
          data = JSON.stringify(data);
        }
      }

      // send the request
      self.io(url, {
        'type': type.toUpperCase(),
        'data': data,
        'headers': headers,
        'success': deferred.resolve.bind(deferred),
        'error': deferred.reject.bind(deferred),
        'timeout': timeout,
        'context': context
      });

      return promise;
    };
  }
});
