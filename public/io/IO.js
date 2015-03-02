'use strict';

/**
  * Provides http IO.
  * @module io/IO
  * @extends module:io/IOBase
  * @requires module:io/IOBase
  *
  * @example
  * var IOHttp = require('io/IO');
  *
  * var params = {
  *   'thingID': 1345
  * };
  *
  * IOHttp.get('http://www.example.com/api/endpoint', params, 'asdflkj23094802938')
  *   .done(function (response, code) {
  *     //...
  *   })
  *   .fail(function (response, code) {
  *     //...
  *   });
  */

var core = require('wunderbits.core');
var createUID = core.lib.createUID;
var WBDeferred = core.WBDeferred;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var SchemaValidator = require('../validators/SchemaValidator');
var IOBase = require('./IOBase');

var _super = IOBase.prototype;

var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:IO');

var IO = IOBase.extend({

  // make our rest IO evented
  'mixins': [
    WBBindableMixin,
    WBEventsMixin
  ],

  /**
    * @constructor
    * @alias module:io/IO
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.config = options.config;

    // set requests hash on instance
    self.requests = {};

    // verbs are programatically built by _super.initialize
    // need to override now
    self.wrapVerbs();
  },

  /**
    * Moves unwrapped http verbs to _ prefixed names and sets up
    * wrapped unprefixed verbs that execute through #requestWrapper
    */
  'wrapVerbs': function () {

    var self = this;
    var io = self.io;
    ['get', 'patch', 'post', 'put', 'delete'].forEach(function (verb) {
      io['_' + verb] = io[verb];
      io[verb] = self.requestWrapper.bind(self, verb);
    });
  },

  /**
    * Hash for tracking requests made by an instance of this class
    * @type {object}
    */
  'requests': {},

  /**
    * Map of token patterns for use by routes patterns
    */
  'tokens': {
    'id': '([-])?[0-9]+',
    'version': 'v(\\d)+',
    'provider': '[a-z]+'
  },

  /**
    * Map of paths patterns that should map to the 'api' host
    */
  'routes': {
    'api': []
  },

  /**
    * Map of paths patterns that do not require authorization headers
    */
  'authFreeRoutes': {
    'api': [
      'health',
      '{{version}}/oauth/{{provider}}/exchange',
      '{{version}}/signup',
      '{{version}}/authenticate',
      '{{version}}/user/password/reset'
    ]
  },

  // make relative URLs absolute
  'normalizeUrl': function (url) {

    var self = this;
    return self.config.api.host + url;
  },

  /**
    * Extend #extendHeaders to inject clientID
    */
  'extendHeaders': function (headers) {

    var self = this;

    var clientID = self.config.clientID;
    var deviceID = self.config.deviceID;
    var instanceID = self.config.instanceID;

    clientID && (headers['x-client-id'] = clientID);
    deviceID &&(headers['x-client-device-id'] = deviceID);
    instanceID && (headers['x-client-instance-id'] = instanceID);

    if (typeof self.config.extendHeaders === 'function') {
      self.config.extendHeaders(headers);
    }

    return _super.extendHeaders.apply(self, arguments);
  },

  /**
    * Adds x-access-token and x-client-id headers to api endpoints that require them.
    * @param {object} headers - current headers for the request being constructed
    * @param {string} url - url for the request being constructed
    */
  'setAuthorization': function (headers) {

    var self = this;

    var accessToken = self.config.accessToken;
    accessToken && (headers['x-access-token'] = accessToken);
  },

 /**
    * Wrapper for CRUD methods to inject supplied requestID, or auto generated requestID
    * @returns {promise} Request promise.
    * @param {string} method - HTTP method to execute
    * @param {string} path - URI or path to make request against
    * @param {object} [data] - Request body or hash of key value pairs for GET params
    * @param {string} [requestID] - User supplied requestID to be sent as a header, auto generated if omitted
    * @param {number} [timeout] - User supplied timeout in ms
    */
  'requestWrapper': function (method, path, data, requestID, timeout) {

    var self = this;
    var deferred = new WBDeferred();
    var headers = {};

    if (!requestID) {
      requestID = self.generateUID();
    }

    self.requests[requestID] = deferred;

    headers['x-client-request-id'] = requestID;

    timeout = timeout ? parseInt(timeout, 10) : 60000;

    self.io['_' + method](path, data, headers, timeout)
      .done(function (response, xhr) {

        if (Array.isArray(response)) {
          response.forEach(function (item) {

            if (item.type) {
              SchemaValidator.validateData(item, item.type);
            }
          });
        }
        else if (response && response.type) {
          SchemaValidator.validateData(response, response.type);
        }

        localConsole.log(xhr.status, path);

        // make the success state exatcly match socket success
        deferred.resolve(response, xhr.status);
      })
      .fail(function (response, xhr) {

        localConsole.error(xhr.status, xhr.statusText, path);

        // make the failure state exactly match socket failure
        deferred.reject(response, xhr.status);

        if (xhr.status === 401) {
          /**
            * Unauthorized event
            * @event module:io/IO#unauthorized
            */
          self.trigger('unauthorized');
        }
      })
      .always(function () {
        // drop reference, but keep id in hash
        self.requests[requestID] = undefined;
      });

    return deferred.promise();
  },

  /**
    * Generates unique indentifiers for proxy requests.
    * @returns {string} UID
    */
  'generateUID': function () {

    var self = this;
    var uid;

    while (!uid || !self.isUIDValid(uid)) {
      uid = createUID();
    }

    return uid;
  },

  /**
    * Checks that UID is not already used by a pending known request.
    * @param {string} uid - UID
    * @returns {boolean} - returns TRUE iff valid
    */
  'isUIDValid': function (uid) {

    return !(uid in this.requests);
  },

  'cancelInflightCreate': function (requestID, onlineID, revision) {

    var self = this;
    var request = self.requests[requestID];

    localConsole.debug('cancelling request locally', requestID, 'alive?', !!request);

    if (request) {
      self.requests[requestID] = undefined;
      var data = onlineID ? {'id': onlineID} : {};
      data.revision = revision;
      request.resolve(data, 200);
    }
  }
});

module.exports = IO;
