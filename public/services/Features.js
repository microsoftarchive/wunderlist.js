'use strict';

/**
  * Provides access to user's features
  * @module services/Features
  * @extends module:services/ServiceGetOnly
  * @requires module:services/ServiceGetOnly
  */

var ServiceGetOnly = require('./ServiceGetOnly');

module.exports = ServiceGetOnly.extend({

  'baseUrl': '/features',

  'type': 'feature'
});
