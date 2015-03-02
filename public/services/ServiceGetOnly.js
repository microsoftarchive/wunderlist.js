'use strict';

/**
  * @module services/ServiceGetOnly
  * @requires module:services/Service
  * @requires module:services/Mixin/ServiceGet
  * @mixes module:services/Mixin/ServiceGet
  * @extends module:services/Service
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;

var BaseService = require('./Service');
var ServiceGet = require('./Mixins/ServiceGet');

var IOHttp = require('../io/IO');

var notAllowed = function () {
  throw new Error ('Method not allowed for this service.');
};

module.exports = BaseService.extend({

  'mixins': [
    ServiceGet
  ],

  'setupRestInterfaces': function () {

    var self = this;

    var http = self.io = new IOHttp({
      'config': self.appState.toJSON()
    });

    self.get = http.io.get;
  },

  /**
    * Overrides default HTTP crud interfaces with RestSocket interfaces.
    */
  'setupSocketInterfaces': function () {

    var self = this;

    var socket = self.options.restSocket;

    assert(socket, 'No RestSocket instance available.');

    self.io = socket;
    self.get = self.io.get;
  },

  'delete': notAllowed,
  'patch': notAllowed,
  'post': notAllowed,
  'put': notAllowed
});
