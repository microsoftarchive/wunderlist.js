'use strict';

/**
  * Default configuration file.
  * Overidable in SDK constructor.
  * @module config/default
  */

module.exports = {
  /**
    * Wunderlist SDK Version
    * @type {string}
    */
  'release': '0.0.0',

  /**
    * Your Client Identification Number/String
    * @type {string}
    */
  'clientID': undefined,

  /**
    * WebSocket connection timeout (in ms)
    * @type {number}
    */
  'webSocketTimeout': 15 * 1000,

  'api': {
    'host': 'https://a.wunderlist.com/api',
  },

  'realtime': {
    'host': 'wss://socket.wunderlist.com:8443/api/v1/sync'
  }
};
