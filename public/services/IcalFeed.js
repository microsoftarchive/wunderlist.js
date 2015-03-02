'use strict';

/**
  * Provides access for fetching the user's ical feed url
  * @module services/Products
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = require('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/ical/feed',
  'type': 'ical_feed',

  'getURL': function (requestID) {

    var self = this;
    return self.get(self.baseUrl, undefined, requestID).promise();
  }
});
