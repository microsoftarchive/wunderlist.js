'use strict';

/**
  * Aopi health checker
  * @module helpers/HealthCheck
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;
var WBBindableMixin = core.mixins.WBBindableMixin;
var WBEventsMixin = core.mixins.WBEventsMixin;

var IOHttp = require('../io/IO');

var networkPollTime = 15 * 1000;

var HealthCheck = WBSingleton.extend({

  'mixins': [
    WBBindableMixin,
    WBEventsMixin
  ],

  'init': function (options) {

    var self = this;

    self.setupIO(options.config);
    self.startPolling();
  },

  'destroy': function () {

    var self = this;
    self.poller && clearInterval(self.poller);
  },

  'setupIO': function (config) {

    var self = this;

    if (!self.io) {
      self.io = new IOHttp({
        'config': config
      }).io;
    }
  },

  'startPolling': function () {

    var self = this;

    self.poller && clearInterval(self.poller);

    self.poller = setInterval(function () {

      self.checkApiHealth();
    }, networkPollTime);
  },

  'checkApiHealth': function () {

    var self = this;
    self.io.get('/health')
      .done(self.onHealthy, self)
      .fail(self.onUnhealthy, self);
  },

  'onHealthy': function () {

    var self = this;
    self.trigger('healthy');
  },

  'onUnhealthy': function () {

    var self = this;
    self.trigger('unhealthy');
  }
});

module.exports = HealthCheck;
