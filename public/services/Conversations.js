'use strict';

/**
  * Provides access to HTML string last 100 conversations
  * @module services/Conversations
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Get HTML page with 100 latest conversations</caption>
    var Conversations = require('services/Conversations');
    var conversations = new ConversationsService();
    conversations.all({
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

var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/conversations',
  'type': 'conversations',

  'all': function (params, requestID) {

    var self = this;
    return self.get(self.baseUrl, params, requestID).promise();
  }
});
