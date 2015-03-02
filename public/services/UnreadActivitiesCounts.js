'use strict';

/**
  * Provides access to unread counts for Activities and Comments
  * @module services/UnreadCounts
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Get unread counts for Activities and Comments</caption>
    var UnreadCountsService = require('services/UnreadCounts');
    var unreadCounts = new UnreadCountsService();
    unreadCounts.all()
      .done(function (data, statusCode) {
        console.log(data.comments);
        console.log(data.activities);
      })
      .fail(function () {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/unread_activity_counts',
  'type': 'unread_activities_count'
});
