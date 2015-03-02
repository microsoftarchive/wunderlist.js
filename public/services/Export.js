'use strict';

/**
  * Provides access to the export service
  * @module services/Export
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = require('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/export',
  'type': 'export',

  'all': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID, 300000).promise();
  }
});
