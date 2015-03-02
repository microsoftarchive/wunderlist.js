'use strict';

/**
  * Provides methods for easy access to task comments states
  * @module services/TaskCommentsStates
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskCommentsStates service</caption>
    var TaskCommentsStatesService = require('services/TaskCommentsStates');
    var taskCommentsStates = new TaskCommentsStatesService();

  * @example <caption>Get the comments states for a list</caption>
    var listID = 239487;
    taskCommentsStates.forList(listID)
      .done(function (taskCommentsStatesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_comments_states',
  'type': 'task_comments_state'
});
