'use strict';

/**
  * Returns browser WebSocket reference, or node.js WebSocket module ws
  * @module io/io/NativeWebSocket
  */

module.exports = global.WebSocket || require('ws');
