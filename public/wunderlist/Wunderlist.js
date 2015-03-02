'use strict';

/**
  * @module wunderlist/Wunderlist

  * @requires module:wunderbits.core/WBEventEmitter
  * @requires module:wunderbits/lib/dependencies

  * @requires module:services/Lists
  * @requires module:services/Memberships
  * @requires module:services/Notes
  * @requires module:services/Reminders
  * @requires module:services/Settings
  * @requires module:services/Subtasks
  * @requires module:services/Tasks
  * @requires module:services/UserEvents
  * @requires module:services/Activities
  * @requires module:services/Conversations
  * @requires module:services/UnreadCounts

  * @requires module:io/RestSocket
  *
  * @extends module:wunderbits.core/WBEventEmitter

  * @example <caption>Create an instance of the main Wunderlist class</caption>
    var WunderlistSDK = require('wunderlist/Wunderlist');

    // Returns an instance of the Wunderlist SDK setup with the correct client ID and user access token
    // and sets up a single WebSocket connection for REST over socket proxying
    var wunderlistSDK = new WunderlistSDK({
      'accessToken': 'a user token',
      'clientID': 'your application id'
    });

    wunderlistSDK.initialized.done(function () {
      // Where handleListData and handleError are functions
      // 'http' here can be replaced with 'socket' to use a WebSocket connection for all requests
      wunderlistSDK.http.lists.all()
        // handleListData will be called with the object parsed from the response JSON
        .done(handleListData)
        // handleError will be called with the error/event
        .fail(handleError);
    });

  */

var core = require('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var WBDeferred = core.WBDeferred;
var extend = core.lib.extend;

var AjaxTransport = require('../io/io/AjaxTransport');
var config = require('../config/default');
var ApplicationStateModel = require('../models/ApplicationState');
var IOHttp = require('../io/IO');
var RestSocket = require('../io/RestSocket');
var PlatformHeaders = require('../helpers/PlatformHeaders');
var ServiceClasses = require('../services');

var MagiConsole = require('magiconsole');

var _super = WBEventEmitter.prototype;

var Wunderlist = WBEventEmitter.extend({

  /**
    * @todo revisit in the future and remove,
    * auth will probably only be available through OAuth.
    */
  'auth': undefined,

  /**
    * Deferred object for tracking initialization success or failure.
    * @type {deferred}
    */
  'state': undefined,

  /**
    * Flag to denote network connectivity.
    * Note: this flag is only to denote a network connection, not API status.
    */
  'online': undefined,

  /**
    * State promise for attaching to initialization events.  Promise of state.
    * @type {promise}
    */
  'initialized': undefined,

  /**
    * Holds references to instances of API HTTP service modules once Wunderlist initialization is completed and successful.
    * @type {object}
    * @property {instance} [lists] - HTTP Instance of {@link module:services/Lists}
    * @property {instance} [memberships] - HTTP Instance of {@link module:services/Memberships}
    * @property {instance} [notes]- HTTP Instance of {@link module:services/Notes}
    * @property {instance} [reminders] - HTTP Instance of {@link module:services/Reminders}
    * @property {instance} [settings] - HTTP Instance of {@link module:services/Settings}
    * @property {instance} [subtasks] - HTTP Instance of {@link module:services/Subtasks}
    * @property {instance} [tasks] - HTTP Instance of {@link module:services/Tasks}
    * @property {instance} [userEvents] - HTTP Instance of {@link module:services/UserEvents}
    */
  'http': undefined,

  /**
    * Holds references to instances of API WebSocket service modules once Wunderlist initialization is completed and successful.
    * @type {object}
    * @property {instance} [lists] - WebSocket Instance of {@link module:services/Lists}
    * @property {instance} [memberships] - WebSocket Instance of {@link module:services/Memberships}
    * @property {instance} [notes]- WebSocket Instance of {@link module:services/Notes}
    * @property {instance} [reminders] - WebSocket Instance of {@link module:services/Reminders}
    * @property {instance} [settings] - WebSocket Instance of {@link module:services/Settings}
    * @property {instance} [subtasks] - WebSocket Instance of {@link module:services/Subtasks}
    * @property {instance} [tasks] - WebSocket Instance of {@link module:services/Tasks}
    * @property {instance} [userEvents] - WebSocket Instance of {@link module:services/UserEvents}
    */
  'socket': undefined,

  /**
    * Main interface to Wunderlist API service modules.
    * @constructor
    * @param {object} options - Class initialization options.
    * @param {string} options.clientID - Client ID is required.
    * @param {string} options.accessToken - Wunderlist access token.
    * @param {array} [options.services] - Services to be initialize.
    *     If not present, all service modules will be initialized.
    *     ex: 'services': ['lists', 'tasks']
    * @param {boolean} [options.debug] - Enable logging
    * @alias module:wunderlist/Wunderlist
    */
  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.options = options = extend(config, options || {});

    self.setupLogging(self.options);

    self.validateOptions();

    self.appState = new ApplicationStateModel(options);

    // initialise PlatformHeader
    PlatformHeaders.init(options);

    var state = self.state = new WBDeferred();
    self.initialized = self.state.promise();

    self.online = self.appState.isOnline();

    self.start()
      .done(state.resolveWith, state, self)
      .fail(state.reject, state);
  },

  'setupLogging': function (options) {

    options.logLevel && MagiConsole.setLevel(options.logLevel);
    options.logPattern && MagiConsole.setPattern(options.logPattern);
  },

  /**
    * Returns true once self.initialized is resolved.
    * @type {boolean}
    */
  'isInitialized': function () {

    var self = this;
    return !!(self.initialized && self.initialized.state() === 'resolved');
  },

  /**
    * Calls services initialization if/once authorized
    * @returns {promise}
    */
  'start': function () {

    var self = this;
    var promise;

    promise = self.getServices();

    // watch online state
    self.bindTo(self.appState, 'change:online', 'onOnlineOffline');

    // report timings
    self.bindTo(AjaxTransport, 'timing:io', 'onIOTiming');

    return promise;
  },

  /**
    * Set self.online state and trigger exposed online/offline event
    */
  'onOnlineOffline': function () {

    var self = this;
    self.online = self.appState.isOnline();
    self.trigger(self.online ? 'online' : 'offline');
  },

  'onIOTiming': function (ioTimingData) {

    var self = this;
    self.trigger('timing:io', ioTimingData);
  },

  /**
    * Creates instances of service modules according to initialization options.
    * @param {array} [services] - Array of services to initialize.
    * Default is initialize all services.
    * @returns {promise} Hash of initialized services.
    */
  'getServices': function () {

    var self = this;

    var compiledServices = {
      'http': {},
      'socket': {}
    };
    var service, services, Klass;
    var deferred = new WBDeferred();

    var accessToken = self.appState.attributes.accessToken;

    self.createSocket(accessToken).done(function createServices () {

      // clear old services
      self.http = undefined;
      self.socket = undefined;

      // from args, options, or default to all
      services = services || self.options.services || Object.keys(ServiceClasses);

      self.httpIO = new IOHttp({
        'config': self.appState.toJSON()
      });

      for (var i = 0, len = services.length; i < len; i++) {
        service = services[i];
        Klass = ServiceClasses[service];

        // http service
        compiledServices.http[service] = new Klass({
          'appState': self.appState,
          'httpIO': self.httpIO
        });
        self.bindTo(compiledServices.http[service], 'unauthorized', self.onUnauthorized);

        // socket service
        compiledServices.socket[service] = new Klass({
          'websocket': true,
          'restSocket': self.restSocket,
          'appState': self.appState
        });
      }

      self.http = compiledServices.http;
      self.socket = compiledServices.socket;

      deferred.resolve(compiledServices);
    });

    return deferred.promise();
  },

  'isSocketOnline': function () {

    var self = this;

    var restSocket = self.restSocket;
    var socket = restSocket && restSocket.socket;
    var webSocketConnected = !!(socket && socket.isConnected());

    return webSocketConnected;
  },

  /**
    * Returns self.socket or self.http depending on self.restSocket.socket.connected
    */
  'getOutlet': function () {

    var self = this;

    var webSocketConnected = self.isSocketOnline();
    var forcedHttp = !!self.options.forceHTTP;

    return (webSocketConnected && !forcedHttp) ? self.socket : self.http;
  },

  /**
    * Creates an instance of RestSocket using the current appState configuration
    * @fires module:wunderlist/Wunderlist#event
    * @returns {promise} Promise of WebSocket ready deferred
    */
  'createSocket': function () {

    var self = this;

    self.restSocket && self.unbindFrom(self.restSocket);

    var restSocket = new RestSocket({
      'appState': self.appState,
      'config': self.options
    });
    self.restSocket = restSocket;

    self.bindTo(restSocket, 'event', function (data) {

      /**
        * Realtime events messages event.
        * @event module:wunderlist/Wunderlist#event
        * @type {object}
        */
      self.trigger('event', data);
    });

    self.bindTo(restSocket, 'desktopNotification', function (data) {

      /**
        * Realtime desktop notifications.
        * @event module:wunderlist/Wunderlist#desktopNotification
        * @type {object}
        */
      self.trigger('desktopNotification', data);
    });

    self.bindTo(restSocket, 'unauthorized', self.onUnauthorized);
    self.bindTo(restSocket, 'timing:io', 'onIOTiming');

    return restSocket.ready.promise();
  },

  /**
    * Destroys instance of Wunderlist on unauthorized event.
    */
  'onUnauthorized': function () {

    var self = this;
    self.trigger('unauthorized');
    self.destroy();
  },

  /**
    * Method to destroy and clean up instance.
    */
  'destroy': function () {

    var self = this;

    // kill the socket
    self.restSocket && self.restSocket.destroy();

    // clear all the bindings
    self.unbindAll();

    // destroy all the services
    var protocols = ['http', 'socket'];
    protocols.forEach(function (protocol) {

      var theService;
      for (var service in self[protocol]) {
        theService = self[protocol][service];
        theService.destroy && theService.destroy();
      }
      self[protocol] = undefined;
    });

    self.appState.destroy();

    // delete all properties
    // make sure a destroyed object is not keeping other
    // objects alive by reference
    function killEverything (obj) {
      for (var key in obj) {
        obj[key] = undefined;
      }
    }
    killEverything(self);

    // flag as destroyed, so objects internal methods
    // can optionally check this before execution
    self.destroyed = true;
  },

  /** TRUE when instance has been destroyed */
  'destroyed': false,

  /**
    * Validates initialization options
    * @returns {boolean} True if options are valid
    */
  'validateOptions': function () {

    var self = this;
    var options = self.options || {};

    var validAuthCredentials = !!options.accessToken;
    if (!options.clientID || !validAuthCredentials) {
      throw new Error('Cannot initialize the Wunderlist SDK without a Client ID or auth credentials');
    }
  },

  'cancelInflightCreate': function (requestID, onlineID, revision) {

    var self = this;

    var restSocket = self.restSocket;
    var httpIO = self.httpIO;
    restSocket && restSocket.cancelInflightCreate(requestID, onlineID, revision);
    httpIO && httpIO.cancelInflightCreate(requestID, onlineID, revision);
  }
}, {
  'services': ServiceClasses,
  'headers': PlatformHeaders
});

module.exports = Wunderlist;
