'use strict';

/**
  * Provides methods for easy access to task comments.
  * @module services/TaskComments
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the TaskComments service</caption>
    var TaskCommentsService = require('services/TaskComments');
    var taskComments = new TaskCommentsService();

  * @example <caption>Get all comments for a task</caption>
    var taskID = 239487;
    taskComments.forTask(taskID)
      .done(function (taskCommentsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get all task comments for all tasks in a list</caption>
    var listID = 239487;
    taskComments.forList(listID)
      .done(function (taskCommentsData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a task comment</caption>
    taskComments.create({
      'task_id': 349587,
      'text': 'Hello world!'
    })
    .done(function (taskCommentData, statusCode) {
      // ...
    })
    .fail(function (resp, code) {
      // ...
    });

  * @example <caption>Mark a task comment as having been read</caption>
    var taskCommentID = 2394872;
    var taskCommentRevision = 1;
    var readData = {
      'read': true
    };
    taskComments.update(taskCommentID, taskCommentRevision, readData)
      .done(function (taskCommentData, statusCode) {
        // ...
      })
      .fail(fucntion (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/task_comments',
  'type': 'task_comment'
});
