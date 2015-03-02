'use strict';

/**
  * Provides methods for easy access to memberships data.
  * @module services/Memberships
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Memberships service</caption>
    var MembershipsService = require('services/Memberships');
    var memberships = new MembershipsService();

  * @example <caption>Get all memberships for a user</caption>
    var userID = 5687;
    memberships.forUser(userID)
      .done(function (memberhipsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get all memberships for a list</caption>
    var listID = 56879;
    memberships.forList(listID)
      .done(function (memberhipsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Invite a user to a list</caption>
    var membershipData = {
      'list_id': 5687,
      'user_id': 4340598
    };
    memberships.create(membershipData)
      .done(function (newMembership, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Invite an email address to a list</caption>
    var membershipData = {
      'email': 'TheDarkKnight@arkham.asylum',
      'user_id': 4340598
    };
    memberships.create(membershipData)
      .done(function (newMembership, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Accept a pending membership</caption>
    var membershipID = 569859;
    var membershipRevision = 0;
    var acceptData = {
      'state': 'accepted'
    };
    memberships.update(membershipID, membershipRevision, acceptData)
      .done(function (membershipData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a membership</caption>
    var membershipID = 569859;
    var membershipRevision = 0;
    memberships.delete(membershipID, membershipRevision)
      .done(function (data, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var core = require('wunderbits.core');
var WBDeferred = core.WBDeferred;

var UserService = require('./User');
var AuthenticatedService = require('./AuthenticatedService');

var _super = AuthenticatedService.prototype;
module.exports = AuthenticatedService.extend({
  'baseUrl': '/memberships',
  'type': 'membership',

  'initialize': function (options) {

    var self = this;
    _super.initialize.apply(self, arguments);

    self.userService = new UserService(options);
  },

  'mine': function () {

    var self = this;
    var deferred = new WBDeferred();

    self.userService.all()
      .done(function (userData) {

        self.forUser(userData.id)
          .done(deferred.resolve, deferred)
          .fail(deferred.reject, deferred);
      })
      .fail(deferred.reject, deferred);

    return deferred.promise();
  }
});
