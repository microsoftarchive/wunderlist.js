'use strict';

/**
  * Provides methods for easy access to the import endpoint.
  * @module services/Import
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/import',
  'type': 'import',

  'create': function (data, requestID) {

    var self = this;
    return self.post(self.baseUrl, data, requestID, 300000).promise();
  }
});
