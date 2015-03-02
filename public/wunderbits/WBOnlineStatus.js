'use strict';


// Network connectivity monitor.
// Based on http://robertnyman.com/html5/offline/online-offline-events.html

var core = require('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;

var HealthCheck = require('../helpers/HealthCheck');

var navigator = global.navigator || { 'onLine': true };

var WBOnlineStatus = WBEventEmitter.extend({

  'online': null,

  'initialize': function (options) {

    var self = this;
    var document = global.document;

    self.online = navigator.onLine;

    if (global.addEventListener) {
      // normal browsers
      global.addEventListener('online', self.onOnline.bind(self), false);
      global.addEventListener('offline', self.onOffline.bind(self), false);
    }
    // ie ?
    else if (document) {
      var body = document.body;
      body.ononline = self.isOnline;
      body.onoffline = self.isOffline;
    }

    options.config.checkHealth && self.bindToApiHealth(options);
  },

  'destroy': function () {

    HealthCheck.destroy();
  },

  'bindToApiHealth': function (options) {

    var self = this;

    HealthCheck.init(options);

    self.bindTo(HealthCheck, 'healthy', 'onOnline');
    self.bindTo(HealthCheck, 'unhealthy', 'onOffline');
  },

  'isOnline': function () {

    return this.online;
  },

  'onOnline': function () {

    var self = this;
    self.online = true;
    self.trigger('online');
  },

  'onOffline': function () {

    var self = this;
    self.online = false;
    self.trigger('offline');
  }
});

module.exports = WBOnlineStatus;
