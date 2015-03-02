'use strict';

/**
  * Request queue mixin for throttling http and rest socket requests
  * @module io/mixins/RequestQueueMixin
  * @extends wunderbits/WBMixin
  * @requires validators/SchemaValidator
  */

var core = require('wunderbits.core');
var createUID = core.lib.createUID;
var WBMixin = core.WBMixin;

module.exports = WBMixin.extend({

  /**
    * Maximum number of open ajax requests.
    * @type {number}
    */
  'maxRequests': 5,

  /**
    * Queue of pending ajax requests
    * @type {array}
    */
  'requestsQueue': [],

  /**
    * Hash of currently executing ajax requests
    * @type {object}
    */
  'executingRequests': {},

  /** Resets queues*/
  'reset': function () {

    var self = this;
    self.requestsQueue = [];
    self.executingRequests = {};
  },

  /** Checks request queue for pending requests and flushes if allowed*/
  'checkQueue': function () {

    var self = this;
    var requests = Object.keys(self.executingRequests).length;
    var requestData;

    if (requests < self.maxRequests) {
      requestData = self.requestsQueue.shift();
      requestData && self.executeRequest(requestData);
    }
  },

  /**
    * Queues a request and creates request's deffered object.
    * @param {string} url - request URL
    * @param {object} options - request options
    * @param {constructor} RequestDeferredClass - request deferred contructor
    * @returns {deferred}
    */
  'queueRequest': function (url, options, RequestDeferredClass) {

    var self = this;
    var deferred = new RequestDeferredClass();

    self.requestsQueue.push({

      'deferred': deferred,
      'url': url,
      'options': options,
      'queueID': createUID()
    });

    self.checkQueue();

    return deferred;
  },

  'executeRequest': function (requestData) {

    throw new Error('You must override RequestQueueMixin#executeRequest!', requestData);

    // // Example from AjaxTransport#executeRequest
    // var self = this;

    // var url = requestData.url;
    // var options = requestData.options;
    // var deferred = requestData.deferred;

    // self.executingRequests[requestData.queueID] = requestData;

    // var request = self.xhrRequest(url, {

    //   'type': options.type,
    //   'data': options.data,
    //   'headers': options.headers,
    //   'timeout': options.timeout
    // }, deferred);

    // request
    //   .done(function (data, xhr) {

    //     self.onSuccess(data, xhr, options);
    //   })
    //   .fail(function (data, xhr) {

    //     self.onFailure(data, xhr, options);
    //   })
    //   .always(function () {

    //     delete self.executingRequests[requestData.queueID];
    //     self.checkQueue();
    //   });
  }
});
