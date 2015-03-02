'use strict';

/**
  * @module services/AuthenticatedService
  * @extends module:services/Service
  * @requires module:services/Service
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;

var BaseService = require('./Service');

var _super = BaseService.prototype;

module.exports = BaseService.extend({

  /**
    * Base class for Wunderlist API service modules that require authentication.
    * @constructor
    * @alias module:services/AuthenticatedService
    */
  'initialize': function () {
    var self = this;
    _super.initialize.apply(self, arguments);
    self.validateAccessParams();
  },

  /**
    * Checks that clientID and accessToken are available
    */
  'validateAccessParams': function () {

    var self = this;
    var config = self.appState.attributes;
    assert.string(config.clientID, 'This service requires a client ID.');
    assert.string(config.accessToken, 'This service requires an access token.');
  }
});
