'use strict';

/**
  * Provides methods for easy access to task positions.
  * @module services/TaskPositions
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskPositions service</caption>
    var TaskPositionsService = require('services/TaskPositions');
    var taskPositions = new TaskPositionsService();

  * @example <caption>Get task positions for a list</caption>
    var listID = 123987;
    taskPositions.forList(listID)
      .done(function (taskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific task position object</caption>
    var taskPositionID = 239487;
    taskPositions.getID(taskPositionID)
      .done(function (taskPositionData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update positions for a list's tasks</caption>
    var taskPositionsID = 349587;
    var taskPositionsRevision = 23;
    var updateData = {
      'values': [2234,45645,76567,567978]
    };
    taskPositions.update(taskPositionsID, taskPositionsRevision, updateData)
      .done(function (taskPositionsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_positions',
  'type': 'task_position'
});
