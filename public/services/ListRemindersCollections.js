'use strict';

/**
  * Provides methods for easy access to users data.
  * @module services/Users
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Users service</caption>
    var UsersService = require('services/Users');
    var users = new UsersService();

  * @example <caption>Fetch the users this logged in user can access</caption>
    users.all()
      .done(function (usersData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/list_reminders_collections',
  'type': 'list_reminders_collection'
});
