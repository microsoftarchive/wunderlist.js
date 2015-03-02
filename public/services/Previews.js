'use strict';

/**
  * Provides methods for easy access to file preview data.
  * @module services/Previews
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Previews service</caption>
    var PreviewsService = require('services/Previews');
    var previews = new PreviewsService();

  * @example <caption>Get preview for a file</caption>
    var fileID = 87987;
    previews.getPreview(fileID)
      .done(function (previewData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */

var AuthenticatedService = require('./AuthenticatedService');
module.exports = AuthenticatedService.extend({

  'baseUrl': '/previews',
  'type': 'preview',

  // GET a.wunderlist.com/api/v1/files/:id/preview?platform=mac&size=retina
  'getPreview': function (id, platform, size, requestID) {

    var self = this;

    var params = {
      'file_id': id,
      'platform': platform,
      'size': size
    };

    return self.get(self.baseUrl, params, requestID);
  }
});
