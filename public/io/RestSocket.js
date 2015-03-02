'use strict';

/**
  * @module io/RestSocket
  * @requires module:io/io/WebSocket
  * @requires module:helpers/URL
  * @requires module:wunderbits/lib/SafeParse
  * @requires module:wunderbits.core/lib/createUID
  * @extends module:wunderbites/WBEventEmitter
  *
  * @example
  * var IORestSocket = require('io/RestSocket');
  *
  * var params = {
  *   'thingID': 1345
  * };
  *
  * IORestSocket.get('http://www.example.com/api/endpoint', params, 'asdflkj23094802938')
  *   .done(function (response, code) {
  *     //...
  *   })
  *   .fail(function (response, code) {
  *     //...
  *   });
  */

var core = require('wunderbits.core');
var createUID = core.lib.createUID;
var extend = core.lib.extend;
var WBEventEmitter = core.WBEventEmitter;
var WBDeferred = core.WBDeferred;

var PlatformHeaders = require('../helpers/PlatformHeaders');
var RequestQueueMixin = require('./mixins/RequestQueueMixin');
var RestSocketRequestDeferred = require('../deferreds/RestSocketRequestDeferred');
var SafeParse = require('../wunderbits/lib/SafeParse');
var SchemaValidator = require('../validators/SchemaValidator');
var URLHelper = require('../helpers/URL');
var WebSocket = require('./io/WebSocket');

var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:RESTSOCKET');

var SocketRequestQueueMixin = RequestQueueMixin.extend({

  'maxRequests': 100,

  'executeRequest': function (requestData) {

    var self = this;

    var options = requestData.options;

    self.socketRequest(
      requestData.deferred,
      options.method,
      options.uri,
      options.data,
      options.requestID,
      options.requestType
    )
    .always(function executeRequestDone () {

      delete self.executingRequests[requestData.queueID];
      self.checkQueue();
    });
  }
});

var _super = WBEventEmitter.prototype;
var RestSocket = WBEventEmitter.extend({

  'mixins': [
    SocketRequestQueueMixin
  ],

  /** Default RestSocket timout duration in milliseconds (16 seconds) */
  'timeout': 60 * 1000,

  /** Holds referenece to instance of WebSocket. */
  'socket': undefined,

  /** Deferred object for getting RestSocket state */
  'ready': undefined,

  /**
    * Hash for managing inprogress WebSocket proxied REST requests
    * @type {object}
    */
  'requests': {},

  /**
    * Wunderlist API RestSocket Module.
    * Performs restful CRUD operations against the Wunderlist API over a WebSocket Proxy
    * @constructor
    * @alias module:io/RestSocket
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.appState = options.appState;
    self.config = options.config;

    self.ready = new WBDeferred();

    self.socket = new WebSocket(options);

    // set requests hash on instance
    self.requests = {};

    // verbs are programatically built by _super.initialize
    // need to override now
    self.wrapVerbs();

    self.pollForTimeouts();
    self.bindToSocket();
    self.ready.resolve();
  },

  'destroy': function () {

    var self = this;

    self.unbindAll();
    self.socket && self.socket.destroy();
    self.destroyed = true;
  },

  /**
    * Wrap the IO verbs
    */
  'wrapVerbs': function () {

    var self = this;

    // TODO: merge this with io.js#wrapVerbs
    // maybe move this into a mixin
    var verbs = ['get', 'post', 'put', 'patch', 'delete'];
    verbs.forEach(function (verb) {

      var fn = self[verb];
      self[verb] = function () {
        return fn.apply(self, arguments);
      };
    });
  },

  /**
    * Sets up interval timer to check for request timeouts.
    */
  'pollForTimeouts': function () {

    var self = this;

    self.timer && clearInterval(self.timer);
    self.timer = setInterval(function () {

      self.checkForRequestTimeouts();
    }, 1000);
  },

  /**
    * Close raw WebSocket connection if open.
    */
  'close': function () {

    var self = this;
    self.socket && self.socket.close();
  },

  /** Binds to WebSocket message events */
  'bindToSocket': function () {

    var self = this;
    self.bindTo(self.socket, 'open', 'onSocketConnect');
    self.bindTo(self.socket, 'message', 'onMessage');
    self.bindTo(self.socket, 'close', 'onSocketFalure');
    self.bindTo(self.socket, 'close', 'onSocketDisconnect');
    self.bindTo(self.socket, 'error', 'onSocketFalure');
  },

  /**
    * Real socket is open and ready.  Trigger a connected event.
    */
  'onSocketConnect': function (e) {

    var self = this;

    self.getSocketHealth()
      .done(function () {

        self.connected = true;
        self.trigger('connected', e);
        self.pollHealth();
      })
      .fail(self.close, self);
  },

  /**
    * Starts polling for health
    */
  'pollHealth': function () {

    var self = this;

    self.cancelPollHealth();

    self.poller = setInterval(function () {

      if (self.connected) {
        self.getSocketHealth()
          .fail(self.close, self);
      }
      else {
        self.cancelPollHealth();
      }
    }, 15000);
  },

  /**
    * Cancels the poller timer
    */
  'cancelPollHealth': function () {

    var self = this;
    self.poller && clearInterval(self.poller);
  },

  /**
    * Get the socket health state
    * @returns {promise} - A promise that resolves or rejects depending on the health
    */
  'getSocketHealth': function () {

    var self = this;

    var request = self.request(undefined, undefined, undefined, undefined, 'health')
      .done(function (resp, code) {

        localConsole.info('websocket healthy', resp || '', code);
      })
      .fail(function (resp, code) {

        localConsole.error('websocket not healthy', resp || '', code);
      });

    return request.promise();
  },

  /**
    * Real socket is closed.  Trigger a disconnected event.
    */
  'onSocketDisconnect': function (e) {

    var self = this;

    self.cancelPollHealth();
    self.connected = false;
    self.trigger('disconnected', e);
  },

  /**
    * Handles incomming messages from WebSocket
    * @param {event} e - WebSocket event
    */
  'onMessage': function (e) {

    var self = this;
    var data = SafeParse.json(e.data);
    if (data && data.headers) {
      data.headers = self.normalizeHeaders(data.headers);
    }

    var requestID = self.extractRequestIDFromHeaders(data);
    var request = requestID && self.requests[requestID];
    self.parseDataBody(data);

    switch (data.type) {
    case 'request':
      request && self.handleRequest(request, data, requestID);
      break;
    case 'health':
      request && self.handleHealthRequest(request, data, requestID);
      break;
    case 'desktop_notification':
      self.handleDesktopNotification(data);
      break;
    case 'mutation':
      self.isCorrectMutationVersion(data) && self.handleMessage(data);
      break;
    default:
      self.handleMessage(data);
    }
  },

  /**
    * Extracts the request id from the data
    * @param {object} data - the request data
    * @returns {integer} id - the request id
    */
  'extractRequestIDFromHeaders': function (data) {

    return data && data.headers && data.headers['x-client-request-id'];
  },

  /**
    * Convert body on data to a real object
    * @param {object} data - the request data
    */
  'parseDataBody': function (data) {

    data && data.body && (data.body = SafeParse.json(data.body));
  },

  /**
    * Validates realtime mutations to the correct api version
    * @param {object} mutationData - raw mutation data
    * @returns {bool}
    */
  'isCorrectMutationVersion': function (mutationData) {

    var isCorrectVersion = false;

    var type = mutationData.subject.type;
    var version = mutationData.version;

    var versionTwoEndpoints = [
      'file'
    ];

    var canBeVersionTwo = versionTwoEndpoints.indexOf(type) !== -1;
    var isVersionTwo = version === 2;
    var isVersionOne = version === 1;

    if (canBeVersionTwo && (isVersionTwo || isVersionOne)) {
      isCorrectVersion = true;
    }
    else if (isVersionOne) {
      isCorrectVersion = true;
    }

    return isCorrectVersion;
  },

  /**
    * Handles messages that correspond to requests made by this module.
    * @param {deferred} request - The request's deferred object.
    * @param {data} data - The WebSocket message JSON parsed body.
    */
  'handleRequest': function (request, data, requestID) {

    var self = this;

    request.endTime = Date.now();

    var okay = /^2/.test(data.status);
    self.logRequestTimings(okay, request, data);

    if (Array.isArray(data.body)) {
      data.body.forEach(function (item) {

        if (item.type) {
          SchemaValidator.validateData(item, item.type);
        }
      });
    }
    else if (data.body && data.body.type) {
      SchemaValidator.validateData(data.body, data.body.type);
    }

    request[okay ? 'resolve' : 'reject'](data.body, data.status);
    self.checkStillAuthorized(data.status);
    self.requests[requestID] = undefined;
  },

  /**
    * Handles health requests
    */
  'handleHealthRequest': function (request, data, requestID) {

    var self = this;

    request.endTime = Date.now();

    var okay = data.body && data.body.healthy === true;
    self.logRequestTimings(okay, request, data);
    request[okay ? 'resolve' : 'reject'](data.body, data.status);
    self.requests[requestID] = undefined;
  },

  /**
    * Handles request times
    */
  'logRequestTimings': function (okay, request, data) {

    var args = [data.status, request.uri, request.endTime - request.startTime];
    if (okay) {
      this.triggerTiming(request);
      localConsole.info.apply(localConsole, args);
    }
    else {
      localConsole.error.apply(localConsole, args);
    }
  },

  /**
    * Triggers out timings
    */
  'triggerTiming': function (requestDeferred) {

    var self = this;

    var requestTime = requestDeferred.startTime;
    requestDeferred.loadDurationTime = requestDeferred.endTime - requestTime;
    requestDeferred.latencyTime = requestDeferred.loadDurationTime;

    var timingData = {
      'start': requestTime,
      'end': requestDeferred.endTime,
      'duration': requestDeferred.loadDurationTime,
      'latency': requestDeferred.latencyTime,
      // can't find any data available on
      // websocket messages to calculate download time
      'download': undefined,
      'url': requestDeferred.uri,
      'type': 'websocket'
    };

    // trigger on self
    self.trigger('timing:io', timingData);
  },

  /**
    * Triggers unauthorized event if the response status is 401.
    * @param {Number} statusCode - HTTP Status Code
    * @fires module:io/RestSocket#unauthorized
    * @todo instance of Wunderlist class should destroy and cleanup self when unauthorized
    */
  'checkStillAuthorized': function (statusCode) {

    var unauthorized = 'unauthorized';
    if (statusCode === 401) {
      /**
        * Unauthorized event
        * @event module:io/RestSocket#unauthorized
        */
      this.trigger(unauthorized);
    }
  },

  /**
    * Handle arbitrary WebSocket messages.
    * @fires module:io/RestSocket#event
    * @fires module:io/RestSocket#someCRUDOperation
    */
  'handleMessage': function (data) {

    var self = this;

    localConsole.debug('arbitrary message', data);

    var type = data && data.subject && data.subject.type;
    type && SchemaValidator.validateData(data.data, type);

    /**
      * Socket raw changes endpoint event
      * @event module:io/RestSocket#event
      * @type {object}
      */
    self.trigger('event', data);

    var operation = data && data.operation;
    if (operation) {
      /**
        * Socket scoped changes endpoint event
        * @event module:io/RestSocket#someCRUDOperation
        * @type {object}
        */
      self.trigger(operation, data);
    }
  },

  /**
    * Handle desktop notifications.
    * @fires module:io/RestSocket#desktopNotification
    */
  'handleDesktopNotification': function (data) {

    var self = this;

    /**
      * Socket desktop notifications
      * @event module:io/RestSocket#desktopNotification
      * @type {object}
      */
    self.trigger('desktopNotification', data);
  },

  /**
    * Sets up restful proxy request to the Wunderlist API over a WebSocket
    * @param {string} method - The rest CRUD operation: POST, GET, PUT, DELETE
    * @param {string} uri - The API path to proxy to: /api/v1/settings
    * @param {object} data - Data to send with a POST or PUT.
    * @param {string} [requestID] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'request': function (method, uri, data, requestID, requestType) {

    var self = this;

    var options = {
      'method': method,
      'uri': uri,
      'data': data,
      'requestID': requestID,
      'requestType': requestType
    };

    var request = self.queueRequest(uri, options, RestSocketRequestDeferred);
    return request.promise();
  },

  /**
    * Sends out a socket request
    */
  'socketRequest': function (requestDeferred, method, uri, data, requestID, requestType) {

    var self = this;

    var socket = self.socket;

    requestID = requestID || self.generateUID();

    var headers = self.compileHeaders(requestID);

    var json = {
      'type': requestType || 'request',
      'headers': self.normalizeHeaders(headers)
    };

    method && (json.verb = method);
    uri && (json.uri = uri);

    if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && data) {
      json.body = JSON.stringify(data);
    }

    // add additional request information to the request deferred object
    requestDeferred.requestID = requestID;
    requestDeferred.uri = uri;
    requestDeferred.startTime = Date.now();

    self.requests[requestID] = requestDeferred;

    // only send messages if the socket is still connected
    if (self.appState.isOnline() && self.socket.isConnected()) {
      socket.send(JSON.stringify(json));
    }
    else {
      requestDeferred.reject({
        'errors': ['no websocket connection available']
      }, 0);
    }

    return requestDeferred.promise();
  },

  /**
    * Compiles headers
    */
  'compileHeaders': function (requestID) {

    var self = this;
    var headers = {
      'x-client-request-id': requestID,
      'x-client-id': self.appState.attributes.clientID,
      'x-client-instance-id': self.appState.attributes.instanceID,
      'x-client-device-id': self.appState.attributes.deviceID,
      'content-type': 'application/json',
      'accept': 'application/json'
    };

    headers = extend(headers, PlatformHeaders.headers);

    if (self.config && (typeof self.config.extendHeaders === 'function')) {
      self.config.extendHeaders(headers);
    }

    var val;
    for (var header in headers) {
      val = headers[header];
      if (val === undefined || val === null) {
        delete headers[header];
      }
    }

    return headers;
  },

  /**
    * Normalizes headers to all lowercase
    */
  'normalizeHeaders': function (headers) {

    var normalize = {};

    for (var key in headers) {
      normalize[key.toLowerCase()] = headers[key];
    }

    return normalize;
  },

  /**
    * Wrapper for CRUD methods that calls #request when WebSocket is ready.
    * @returns {promise} Request promise.
    */
  'requestWrapper': function (method, path, data, requestId) {

    var self = this;
    var deferred = new WBDeferred();

    path = '/api' + path;

    self.ready.done(function () {

      self.request(method, path, data, requestId)
        .done(deferred.resolve.bind(deferred))
        .fail(deferred.reject.bind(deferred));
    });

    return deferred.promise();
  },

  /**
    * Cancel all request on a socket failure event (close, error)
    */
  'onSocketFalure': function () {

    var self = this;
    var request;
    for (var requestID in self.requests) {
      request = self.requests[requestID];
      request && request.reject({
        'errors': ['websocket connection lost']
      }, 0);
      self.requests[requestID] = undefined;
    }
  },

  /**
    * Check for request timeouts.
    */
  'checkForRequestTimeouts': function () {

    var self = this;
    var now = Date.now();

    for (var requestID in self.requests) {
      self.checkRequestIsTimedout(self.requests[requestID], now);
    }
  },

  /**
    * Check if a request is timedout.
    * @param {defferred} requestDeferred - Request deffered object
    * @param {number} now - The time in milliseconds
    */
  'checkRequestIsTimedout': function (requestDeferred, now) {

    var self = this;
    if (requestDeferred && now - requestDeferred.startTime >= self.timeout) {

      localConsole.error('timeout', requestDeferred.uri, now - requestDeferred.startTime);

      requestDeferred.reject({
        'errors': ['request timedout locally due to no response in ' + self.timeout]
      }, 408);
      self.requests[requestDeferred.requestID] = undefined;
    }
  },

  /**
    * Makes a DELETE proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} [params] - Params to send as part of delete request.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'delete': function (uri, params, requestId) {

    var url = uri + URLHelper.compileParams(params);
    return this.requestWrapper('DELETE', url, undefined, requestId);
  },

  /**
    * Makes a GET proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} params - Request parameters (key value hash)
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'get': function (uri, params, requestId) {

    var url = uri + URLHelper.compileParams(params);
    return this.requestWrapper('GET', url, undefined, requestId);
  },

  /**
    * Makes a PATCH proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'patch': function (uri, data, requestId) {
    return this.requestWrapper('PATCH', uri, data, requestId);
  },

  /**
    * Makes a POST proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'post': function (uri, data, requestId) {
    return this.requestWrapper('POST', uri, data, requestId);
  },

  /**
    * Makes a PUT proxy request over WebSocket.
    * @param {string} uri - Path to Wunderlist API endpoint.
    * @param {object} data - Data to send.
    * @param {string} [requestId] - Optional request_id, if not provided a UID will be generated for the request.
    * @returns {promise} Request promise.
    */
  'put': function (uri, data, requestId) {

    return this.requestWrapper('PUT', uri, data, requestId);
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

  /**
    * Cancels in-flight socket requests
    */
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

module.exports = RestSocket;
