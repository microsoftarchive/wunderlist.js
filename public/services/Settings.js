'use strict';

/**
  * Provides methods for easy access to user settings.
  * @module services/Settings
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Settings service</caption>
    var SetttingsService = require('services/Settings');
    var settings = new SetttingsService();

  * @example <caption>Get all of a user's settings</caption>
    settings.all()
      .done(function (settingsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific setting</caption>
    var settingID = 5458787;
    settings.getID(settingID)
      .done(function (settingData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a setting</caption>
    var settingData = {
      'key': 'difficulty',
      'value': 'hard mode'
    };
    settings.create(settingData)
      .done(function (settingData, statusCode) {

      })
      .fail(function (resp, code) {

      });

  * @example <caption>Update a setting</caption>
    var settingID = 349587;
    var settingRevision = 87;
    var settingUpdateData = {
      'value': 'insanity'
    };

    settings.update(settingID, settingRevision, settingUpdateData)
      .done(function (settingData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a setting</caption>
    var settingID = 349587;
    var settingRevision = 88;
    settings.deleteID(settingID, settingRevision)
      .always(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/settings',
  'type': 'setting'
});
