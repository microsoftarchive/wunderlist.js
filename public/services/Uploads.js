'use strict';

/**
  * Provides methods for easy access to uploads data.
  * @module services/Uploads
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Uploads service</caption>
    var UploadsService = require('services/Uploads');
    var uploads = new FilesService();

  * @example <caption>Create a upload</caption>

    uploads.create()
      .done(function (uploadData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Update a upload</caption>
    var uploadID = 777;
    var uploadRevision = 2398;
    var updateData = {
      'state': 'finished'
    };
    uploads.update(uploadID, uploadRevision, updateData)
      .done(function (uploadData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });
  */


var AuthenticatedService = require('./AuthenticatedService');

module.exports = AuthenticatedService.extend({
  'baseUrl': '/uploads',
  'type': 'upload',

  // upload creation does not require data, but preserving
  'create': function (data, requestID) {

    var self = this;
    return self.post(self.baseUrl, data, requestID);
  },

  'getPart': function (id, partNumber, requestID) {

    var self = this;

    var params = {
      'part_number': partNumber
    };

    return self.get(self.baseUrl + '/' + id + '/parts', params, requestID);
  },

  'finish': function (id, requestID) {

    var self = this;

    var params = {
      'state': 'finished'
    };

    return self.patch(self.baseUrl + '/' + id, params, requestID);
  }
});