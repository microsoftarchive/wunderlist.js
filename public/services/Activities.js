'use strict';

/**
  * Provides access to HTML string last 100 activities
  * @module services/Activities
  * @extends module:services/Conversations
  * @requires module:services/Conversations

  * @example <caption>Get HTML page with 100 latest activities</caption>
    var ActivitiesService = require('services/Activities');
    var activities = new ActivitiesService();
    activities.all({
        'style': 'desktop',
        'tz_offset': -8
      })
      .done(function (data, statusCode) {
        console.log(data.html);
      })
      .fail(function () {
        // ...
      });
  */

var ConversationsService = require('./Conversations');

module.exports = ConversationsService.extend({
  'baseUrl': '/activities',
  'type': 'activities'
});
