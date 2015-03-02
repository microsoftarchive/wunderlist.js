'use strict';

var core = require('wunderbits.core');
var createUID = core.lib.createUID;

module.exports = {
  'release': '0.0.0',

  'clientID': '81421dc344227b5748d0',

  'deviceID': createUID(),

  'instanceID': createUID(),

  'api': {
    'host': 'https://a.wunderlist.com/api',
  },

  'realtime': {
    'host': 'wss://socket.wunderlist.com:8443/api/v1/sync'
  },

  'example': {
    'host': 'http://example.com'
  },

  'webSocketTimeout': 2 * 1000,

  'testing': true
};