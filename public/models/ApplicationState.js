'use strict';

var core = require('wunderbits.core');
var WBDeferred = core.WBDeferred;
var WBStateModel = core.WBStateModel;
var clone = core.lib.clone;
var WBOnlineStatus = require('../wunderbits/WBOnlineStatus');

var _super = WBStateModel.prototype;
var ApplicationState = WBStateModel.extend({

  'defaults': {
    'api': {
      'host': 'https://a.wunderlist.com/api',
    },
    'realtime': {
      'host': 'wss://socket.wunderlist.com:8443/api/v1/sync'
    },
    'accessToken': undefined,
    'clientID': undefined,
    'debug': false,
    'online': true,
    'webSocketTimeout': 15 * 1000,
    'maxHttpRequests': 5,
    'checkHealth': true
  },

  'initialize': function () {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.initialized = new WBDeferred();

    setTimeout(function () {

      if (self.destroyed) {
        return;
      }

      // Hack until wb.core is updated with correct initialize chains
      self.watchOnlineState();
      self.initialized.resolve();
    });
  },

  'destroy': function () {

    var self = this;

    self.onlineState && self.onlineState.destroy();
    _super.destroy.apply(self, arguments);
  },

  'watchOnlineState': function () {

    var self = this;

    if (self.onlineState) {
      self.unbindFrom(self.onlineState);
      self.onlineState.destroy();
    }

    self.onlineState = new WBOnlineStatus({
      'config': self.toJSON()
    });

    self.set('online', self.onlineState.isOnline());

    self.bindTo(self.onlineState, 'online', 'onOnline');
    self.bindTo(self.onlineState, 'offline', 'onOffline');
  },

  'onOnline': function () {

    this.set('online', true);
  },

  'onOffline': function () {

    this.set('online', false);
  },

  'isOnline': function () {

    return !!this.attributes.online;
  },

  'toJSON': function () {

    return clone(this.attributes);
  }
});

module.exports = ApplicationState;