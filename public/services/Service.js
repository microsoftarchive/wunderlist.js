'use strict';

/**
  * @module services/Service

  * @requires module:wunderbits.core/WBEventEmitter

  * @requires module:io/IO

  * @requires module:services/Mixin/ServiceGet
  * @requires module:services/Mixin/ServiceDelete
  * @requires module:services/Mixin/ServiceCreate
  * @requires module:services/Mixin/ServiceUpdate

  * @extends module:wunderbits.core/WBEventEmitter

  * @mixes module:services/Mixin/ServiceGet
  * @mixes module:services/Mixin/ServiceDelete
  * @mixes module:services/Mixin/ServiceCreate
  * @mixes module:services/Mixin/ServiceUpdate
  */

var core = require('wunderbits.core');
var WBEventEmitter = core.WBEventEmitter;
var assert = core.lib.assert;

var ApplicationState = require('../models/ApplicationState');
var IOHttp = require('../io/IO');

var ServiceCreate = require('./Mixins/ServiceCreate');
var ServiceDelete = require('./Mixins/ServiceDelete');
var ServiceGet = require('./Mixins/ServiceGet');
var ServiceUpdate = require('./Mixins/ServiceUpdate');

var verbs = ['get', 'post', 'put', 'patch', 'delete'];

var _super = WBEventEmitter.prototype;

var BaseService = WBEventEmitter.extend({

  'mixins': [
    ServiceCreate,
    ServiceDelete,
    ServiceGet,
    ServiceUpdate
  ],

  /**
    * The service's base path. For example '/tasks' will become 'https://a.wunderlist.com/api/v1/tasks' when an HTTP request is made.
    * @abstract
    * @type {string}
    */
  'baseUrl': undefined,

  /**
    * The API version the service should use.
    * @type {number}
    */
  'apiVersion': 1,

  /**
    * The service's resource type. For examples 'Task' for services/Tasks
    * @abstract
    * @type {string}
    */
  'type': undefined,

  /**
   * io helper
   */
  'io': undefined,

  /**
    * DELETE crud delete
    * @method
    */
  'delete': undefined,

  /**
    * GET crud read
    * @method
    */
  'get': undefined,

  /**
    * PATCH crud update
    * @method
    */
  'patch': undefined,

  /**
    * POST crud create
    * @method
    */
  'post': undefined,

  /**
    * PUT crud update
    * @method
    */
  'put': undefined,

  /**
    * Base class for Wunderlist API service modules.
    * @constructor
    * @param {object} [options] - Class initialization options.
    * @param {boolean} [options.websocket] - Proxy CRUD operations over a WebSocket.
    * @alias module:services/Service
    */
  'initialize': function (options) {

    var self = this;

    _super.initialize.apply(self, arguments);

    self.options = options = options || {};
    self.appState = options.appState;

    self.checkAppState();

    self.baseUrl = '/v' + self.apiVersion + self.baseUrl;

    if (self.options.websocket) {
      self.setupSocketInterfaces();
    }
    else {
      self.setupRestInterfaces();
    }
  },

  'setupRestInterfaces': function () {

    var self = this;

    var io;

    if (self.options.httpIO) {
      io = self.options.httpIO;
    }
    else {
      io = new IOHttp({
        'config': self.appState.toJSON()
      });
    }

    var http = self.io = io;

    verbs.forEach(function (verb) {

      self[verb] = http.io[verb];
    });

    self.bindTo(self.io, 'unauthorized', function () {

      !self.destroyed && self.trigger('unauthorized');
    });
  },

  /**
    * Allows service to create its own local appstate if one is not passed
    * in initialization options
    */
  'checkAppState': function () {

    var self = this;

    if (!self.appState && self.options.config) {
      self.appState = new ApplicationState(self.options.config);
      self.options.appState = self.appState;
    }
  },

  /**
    * Overrides default HTTP crud interfaces with RestSocket interfaces.
    */
  'setupSocketInterfaces': function () {

    var self = this;
    var socket = self.options.restSocket;

    assert(socket, 'No RestSocket instance available.');

    self.io = socket;

    verbs.forEach(function (verb) {

      self[verb] = self.io[verb];
    });
  },

  /**
    * Method to destroy and clean up instance.
    */
  'destroy': function () {

    var self = this;

    // clear all the bindings
    self.unbindAll();

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

  /** TRUE when instance has been destroyed **/
  'destroyed': false
});

module.exports = BaseService;
