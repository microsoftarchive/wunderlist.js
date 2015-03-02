'use strict';

/**
  * Provides methods for easy access to root.
  * @module services/Root
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Root service</caption>
    var RootService = require('services/Root');
    var root = new RootService();

  * @example <caption>Get a user's root object</caption>
    root.all()
      .done(function (rootData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/root',
  'type': 'root'
});
