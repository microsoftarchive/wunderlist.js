'use strict';

/**
  * Ajax transport that permits a maximum number of open http connections.
  * Queueing and flushing is handled automagically.
  * @module io/io/AjaxTransport
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBDeferred
  * @requires module:wunderbits.core/lib/createUID
  * @requires module:helpers/URL
  * @requires module:wunderbits/lib/SafeParse
  * @requires module:io/io/NativeXMLHttpRequest
  *
  * @example
  * var ajax = require('io/io/AjaxTransport').ajax;
  * var request = ajax('http://www.example.comt/api/endpoint', {
  *   'type': 'GET',
  *   'data': {
  *     'param': 'value'
  *   },
  *   'success': function (data, xhr) {//...},
  *   'error': function (data, xhr) {//...}
  * });
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var urlHelper = require('../../helpers/URL');
var SafeParse = require('../../wunderbits/lib/SafeParse');
var XHR = require('./NativeXMLHttpRequest');
var RequestDeferred = require('../../deferreds/RequestDeferred');
var RequestQueueMixin = require('../mixins/RequestQueueMixin');

var AjaxRequestQueueMixin = RequestQueueMixin.extend({

  'maxRequests': 5,

  /**
  * Executes a pending request
  * @param {object} requestData - queued request data
  */
  'executeRequest': function (requestData) {

    var self = this;

    var url = requestData.url;
    var options = requestData.options;
    var deferred = requestData.deferred;

    self.executingRequests[requestData.queueID] = requestData;

    var request = self.xhrRequest(url, {

      'type': options.type,
      'data': options.data,
      'headers': options.headers,
      'timeout': options.timeout
    }, deferred);

    request
      .done(function (data, xhr) {

        self.onSuccess(data, xhr, options);
      })
      .fail(function (data, xhr) {

        self.onFailure(data, xhr, options);
      })
      .always(function () {

        delete self.executingRequests[requestData.queueID];
        self.checkQueue();
      });
  }
});

var AjaxTransport = WBSingleton.extend({

  'mixins': [
    WBBindableMixin,
    WBEventsMixin,
    AjaxRequestQueueMixin
  ],

  /**
    * Creates and sends an XMLHttpRequest
    * @param {string} url - url for the request
    * @param {object} options - request options
    * @param {string} options.type - request type/method, GET, POST, PUT, DELETE
    * @param {object} [options.data] - request data.  Automatically converted to url params for GET requests
    * @param {number} [options.timeout] - request timeout duration
    * @param {object} [options.headers] - request headers
    * @param {deferred} requestDeferred - request deferred object
    */
  'xhrRequest': function (url, options, requestDeferred) {

    var self = this;

    var async = true;
    var method = options.type;
    var data = options.data;

    // // move data to URL as params
    if (data && method === 'GET') {
      url = urlHelper.generateURI(url, data);
      // unset data so it is not used further down
      data = undefined;
    }

    // Open request
    var request = new XHR();

    // set handlers (BEFORE #OPEN)
    self.attachXhrListeners(request, requestDeferred);

    request.open(method, url, async);

    // setup timeout (AFTER #OPEN)
    if (options.timeout) {
      request.timeout = options.timeout;
    }

    // set headers (BEFORE #SEND)
    self.setupXhrHeaders(request, options.headers, data);

    requestDeferred.startTime = Date.now();

    data ? request.send(data) : request.send();

    // expose some useful things on the deferred request object:
    requestDeferred.url = url;
    requestDeferred.xhr = request;

    return requestDeferred;
  },

  /**
    * Sets up appropriate headers for an XMLHttpRequest
    * @param {XMLHttpRequest} request - XMLHttpRequest
    * @param {object} [headers] - custom headers
    * @param {object} [data] - request data, if present content-type application/json header will be set
    */
  'setupXhrHeaders': function (request, headers, data) {

    var weSpeakJSON = 'application/json; charset=utf-8';

    // set request headers
    if (headers) {
      for (var header in headers) {
        request.setRequestHeader(header.toLowerCase(), headers[header]);
      }
    }

    // Set the correct headers for content-type and accept
    // Note: these are case sensitive for the node XHR object, do not to lower them!
    if (data) {
      request.setRequestHeader('Content-Type', weSpeakJSON);
    }
    // Set accept header
    request.setRequestHeader('Accept', weSpeakJSON);
  },

  /**
    * Attaches event listeners to an XMLHttpRequest
    * @param {XMLHttpRequest} request - XMLHttpRequest
    * @param {requestDeferred} requestDeferred - request deferred
    */
  'attachXhrListeners': function (request, requestDeferred) {

    var self = this;

    // handlers
    request.addEventListener('progress', function (ev) {

      self.onXhrProgress(ev, request, requestDeferred);
    }, false);
    request.addEventListener('load', function (ev) {

      self.onXhrLoad(ev, request, requestDeferred);
    }, false);
    request.addEventListener('error', function (ev) {

      self.onXhrError(ev, request, requestDeferred);
    }, false);
    request.addEventListener('abort', function (ev) {

      self.onXhrAbort(ev, request, requestDeferred);
    }, false);
    request.addEventListener('timeout', function (ev) {

      self.onXhrTimeout(ev, request, requestDeferred);
    }, false);
  },

  /**
    * Handles rejecting or reolving request deferred
    * @param {event} ev - raw event object from XMLHttpRequest
    * @param {XMLHttpRequest} request - the originating XMLHttpRequest
    * @param {requestDeferred} requestDeferred - the request deferred object
    */
  'onXhrLoad': function (ev, request, requestDeferred) {

    var self = this;

    var isSuccess = parseInt(request.status / 100, 10) === 2;
    if (isSuccess) {
      self.triggerTiming(requestDeferred);
    }

    requestDeferred[isSuccess ? 'resolve' : 'reject'].call(requestDeferred, request.responseText, request);
  },

  'triggerTiming': function (requestDeferred) {

    var self = this;

    var now = Date.now();
    var requestTime = requestDeferred.startTime;
    var loadStart = requestDeferred.loadStartTime;
    requestDeferred.loadDurationTime = now - loadStart;
    requestDeferred.latencyTime = loadStart - requestTime;

    self.trigger('timing:io', {
      'start': requestTime,
      'end': now,
      'duration': now - requestTime,
      'latency': requestDeferred.latencyTime,
      'download': requestDeferred.loadDurationTime,
      'url': requestDeferred.url,
      'type': 'ajax'
    });
  },

  'onXhrProgress': function (ev, request, requestDeferred) {

    if (!requestDeferred.loadStarted) {
      requestDeferred.loadStartTime = Date.now();
      requestDeferred.loadStarted = true;
    }
  },

  /** Handles XMLHttpRequest error events */
  'onXhrError': function (ev, request, requestDeferred) {

    // console.log('onXhrError', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest abort events */
  'onXhrAbort': function (ev, request, requestDeferred) {

    // console.log('onXhrAbort', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest timeout events */
  'onXhrTimeout': function (ev, request, requestDeferred) {

    // console.log('onXhrTimeout', ev);
    this.onXhrFail(ev, request, requestDeferred);
  },

  /** Handles XMLHttpRequest failure events */
  'onXhrFail': function (ev, request, requestDeferred) {

    requestDeferred.reject(request.responseText, request);
  },

  /**
    * Main transport request method
    * @param {string} url - request url
    * @param {object} options - request options
    * @returns {deferred}
    */
  'ajax': function (url, options) {

    var self = this;
    var request = self.queueRequest(url, options, RequestDeferred);
    return request;
  },

  /** Handles successful ajax request responses */
  'onSuccess': function (data, xhr, options) {

    if (typeof data === 'string' && xhr.status !== 204) {
      data = SafeParse.json(data);
    }

    options.success && options.success(data, xhr);
  },

  /** Handles unsuccessful ajax request responses */
  'onFailure': function (data, xhr, options) {

    // this does not work with cross-domain firefox,
    // it will always return an empty string
    // yay mozilla!!
    var contentType = (xhr.getResponseHeader('content-type') || '').split(';')[0];
    if (typeof data === 'string' && (/application\/json/.test(contentType))) {
      data = SafeParse.json(xhr.responseText);
    }

    if (typeof options.error === 'function') {
      options.error(data, xhr);
    }
  }
});

module.exports = AjaxTransport;