'use strict';

/**
  * Provides access to oauth services
  * @module services/Services
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/services',
  'type': 'service'
});
