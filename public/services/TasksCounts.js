'use strict';

/**
  * Provides methods for easy access to tasks_count data.
  * @module services/TasksCount
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TasksCount service</caption>
    var TasksCountService = require('services/TasksCount');
    var taskCounts = new TasksCountService();

  * @example <caption>Get a list's task counts</caption>
    var listID = 4349587;
    taskCounts.forList(listID)
      .done(function (taskCounts, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/lists/tasks_count',
  'type': 'tasks_count'
});
