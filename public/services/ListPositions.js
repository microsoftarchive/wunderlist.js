'use strict';

/**
  * Provides methods for easy access to list positions.
  * @module services/ListPositions
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the ListPositions service</caption>
    var ListPositionsService = require('services/ListPositions');
    var listPositions = new ListPositionsService();


  * @example <caption>Get all list positions</caption>
    var ListPositions = require('services/ListPositions');
    var listPositions = new ListPositions();
    listPositions.all()
      .done(function (listPositions, statusCode) {
        //...
      })
      .fail(function (resp, code) {
        //...
      });

  * @example <caption>Update a lists positions object</caption>
    var listPositionsID = 678;
    var listPositionsRevision = 6;
    var updateData = {
      'values': [123,345,567]
    };
    listPositions.update(listPositionsID, listPositionsRevision, updateData)
      .done(function (listPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */


var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/list_positions',
  'type': 'list_position'
});
