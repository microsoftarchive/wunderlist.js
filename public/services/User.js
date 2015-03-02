'use strict';

/**
  * Provides methods for easy access to user data for
  * the currently signed in user.
  * @module services/User
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the User service</caption>
    var UserService = require('services/User');
    var user = new UserService();

  * @example <caption>Fetch all info for the currently logged in user</caption>
    user.all()
      .done(function (userData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:USER');

var AuthenticatedService = require('./AuthenticatedService');
module.exports = AuthenticatedService.extend({
  'baseUrl': '/user',
  'type': 'user',

  'update': function (revision, updateData, requestID) {

    var self = this;
    var hasData = updateData && Object.keys(updateData).length;

    try {
      assert.number(revision, 'Updating a user requires a revision of type number.');
      assert(hasData, 'Updating a user requires data to be sent.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    updateData.revision = revision;

    try {
      self.validateData(updateData, self.type);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0);
    }

    updateData = self.prepareDataForPatch(updateData);

    return self.patch(self.baseUrl, updateData, requestID);
  },

  'changeEmail': function (newEmail, password, requestID) {

    var self = this;

    var data = {
      'email': newEmail,
      'password': password
    };

    return self.patch(self.baseUrl + '/email', data, requestID);
  },

  'changePassword': function (newPassword, currentPassword, requestID) {

    var self = this;

    var updateData = {
      'password': newPassword,
      'old_password': currentPassword
    };

    return self.patch(self.baseUrl + '/password', updateData, requestID);
  },

  'deleteSelf': function (password, requestID) {

    var self = this;

    var params = {
      'password': password
    };

    return self['delete'](self.baseUrl, params, requestID);
  }
});
