'use strict';

/**
  * @module io/io/WebSocket
  * @requires module:wunderbits.core/lib/assert
  * @requires module:wunderbits.core/WBEventEmitter
  * @requires module:helpers/URL
  * @requires module:magiconsole
  * @requires module:io/io/NativeWebSocket
  * @requires module:wunderbits/lib/bindAll
  * @extends module:wunderbits.core/WBEventEmitter
  */

var core = require('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var assert = core.lib.assert;

var URLHelper = require('../../helpers/URL');
var NativeWebSocket = require('./NativeWebSocket');
var bindAll = require('../../wunderbits/lib/bindAll');

var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:WEBSOCKET');

var _super = WBEventEmitter.prototype;

var WebSocketClass = WBEventEmitter.extend({

  /**
    * Was the socket connection close done by the client?
    */
  'clientClosed': false,

  'NativeWebSocketClass': NativeWebSocket,

  /** Holds reference to instance of native WebSocket */
  'socket': undefined,

  /**
    * Wunderlist API native WebSocket Module
    * @constructor
    * @alias module:io/io/WebSocket
    */
  'initialize': function (options) {

    var self = this;

    self.appState = options.appState;

    _super.initialize.apply(self, arguments);

    // TODO: remove this ugly piece of shit, we don't need more binds
    var fns = ['onSocketClose', 'onSocketError', 'onSocketMessage', 'onSocketOpen'];
    bindAll(self, fns);

    self.validateToken();
    self.connect();
    self.bindToAppState();
  },

  'destroy': function () {

    var self = this;

    self.close();
    self.unbindAll();
    self.destroyed = true;
  },

  'bindToAppState': function () {

    var self = this;

    if (self.appState) {
      self.unbindFrom(self.appState);
      self.bindTo(self.appState, 'change:online', function () {

        self[self.appState.isOnline() ? 'connect' : 'close']();
      });
    }
  },

  /** Validates that there is an access token */
  'validateToken': function () {

    assert.string(this.appState.attributes.accessToken, 'Cannot instantiate class without an auth token.');
  },

  /** Connects to Wunderlist API WebSocket */
  'connect': function () {

    var self = this;

    // close any prexising sockets
    self.socket && self.close();

    self.clientClosed = false;
    self.clearSocketTimeout();

    var config = self.appState.attributes;

    var params = {
      'client_id': config.clientID,
      'access_token': config.accessToken,
      'client_device_id': config.deviceID,
      'client_instance_id': config.instanceID
    };

    var host = self.appState.attributes.realtime.host;
    var url = URLHelper.generateURI(host, params);

    var NativeWebSocketClass = self.NativeWebSocketClass;
    self.socket = new NativeWebSocketClass(url);
    self.bindToSocket();
  },

  /**
    * Is the web socket really connected?
    */
  'isConnected': function () {

    var socket = this.socket;
    return !!(socket && socket.readyState === 1);
  },

  /**
    * Sends a message to the Wunderlist API through connected WebSocket
    * @param {string} message - Message to send.
    */
  'send': function (message) {

    this.socket.send(message);
  },

  /**
    * Close WebSocket connection if open.
    */
  'close': function () {

    var self = this;
    self.clientClosed = true;
    if (self.socket) {
      self.socket.close();
      self.socket = undefined;
    }
  },

  /** Binds to native WebSocket events: close, error, message, open */
  'bindToSocket': function () {

    var self = this;
    var socket = self.socket;

    socket.addEventListener('close', self.onSocketClose);
    socket.addEventListener('error', self.onSocketError);
    socket.addEventListener('message', self.onSocketMessage);
    socket.addEventListener('open', self.onSocketOpen);

    self.trackTimeout();
  },

  /**
    * Timout pending socket connection after _timeout duration.
    */
  'trackTimeout': function () {

    var self = this;
    var timeout = self.appState.attributes.webSocketTimeout;

    var start = Date.now();

    var socketTimeoutLoop = function () {

      if (self.socket && self.socket.readyState === 0) {
        if (Date.now() - start < timeout) {
          self.socketTimeout = setTimeout(socketTimeoutLoop, 1000);
        }
        else {
          self.onSocketTimeout();
          if (self.socket) {
            self.socket.close();
            self.socket = undefined;
          }
        }
      }
    };
    socketTimeoutLoop();
  },

  /**
    * Clear socketTimeout timer
    */
  'clearSocketTimeout': function () {

    var self = this;
    self.socketTimeout && clearTimeout(self.socketTimeout);
  },

  /**
    * @fires module:WebSocket#timeout
    */
  'onSocketTimeout': function (ms) {

    var self = this;

    self.clearSocketTimeout();
    localConsole.error('timeout', ms);
    /**
      * @event module:io/io/WebSocket#timeout
      */
    self.trigger('timeout');
  },

  /**
    * @fires module:WebSocket#error
    */
  'onSocketError': function (e) {

    var self = this;

    self.clearSocketTimeout();
    localConsole.error('error', e);
    /**
      * @event module:io/io/WebSocket#error
      * @type {event}
      */
    self.trigger('error', e);
  },

  /**
    * @fires module:WebSocket#open
    */
  'onSocketOpen': function (e) {

    var self = this;

    localConsole.info('opened', e);
    /**
      * @event module:io/io/WebSocket#open
      * @type {event}
      */
    self.trigger('open', e);
  },

  /**
    * @fires module:WebSocket#close
    */
  'onSocketClose': function (e) {

    var self = this;

    self.clearSocketTimeout();
    self.socket = undefined;
    localConsole.info('closed', e);
    /**
      * @event module:io/io/WebSocket#close
      * @type {event}
      */
    self.trigger('close', e);

    /**
      * @todo REMOVE THIS, THIS IS A HACK WHILE PLAY FRAMEWORK IS BROKEN
      */
    if (!self.clientClosed && self.appState.isOnline()) {

      setTimeout(function () {

        !self.destroyed && self.connect();
      }, 1000);
    }
  },

  /**
    * @fires module:WebSocket#message
    */
  'onSocketMessage': function (e) {

    var self = this;
    /**
      * @event module:io/io/WebSocket#message
      * @type {event}
      */
    self.trigger('message', e);
  }
});

module.exports = WebSocketClass;
