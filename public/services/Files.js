'use strict';

/**
  * Provides methods for easy access to files data.
  * @module services/Files
  * @extends module:services/AuthenticatedService
  * @requires module:services/AuthenticatedService

  * @example <caption>Create an instance of the Files service</caption>
    var FilesService = require('services/Files');
    var files = new FilesService();

  * @example <caption>Get files for a task</caption>
    var taskID = 78987;
    files.forTask(taskID)
      .done(function (filesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get files for a list</caption>
    var listID = 87987;
    files.forList(listID)
      .done(function (filesData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Get a specific file</caption>
    var fileID = 34958737;
    files.getID(fileID)
      .done(function (fileData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Create a file</caption>
    var fileData = {
      'upload_id': 458748574,
      'task_id': 4958,
      'file_name': 'awesome file.zip'
    };
    notes.create(noteData)
      .done(function (noteData, statusCode) {
        // ...
      })
      .fail(function (resp, code) {
        // ...
      });

  * @example <caption>Delete a file</caption>
    var fileID = 3487348374;
    var revision = 45;
    notes.deleteID(fileID, revision)
      .always(function (resp, statusCode) {
        // ...
      });
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:FILES');

var AuthenticatedService = require('./AuthenticatedService');
var _super = AuthenticatedService.prototype;

module.exports = AuthenticatedService.extend({

  'apiVersion': 2,
  'baseUrl': '/files',
  'type': 'file',

  'create': function (data, requestID) {

    var self = this;

    try {
      self.validateCreateData(data);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var request = _super.create.call(self, data, requestID);
    return request.promise();
  },

  'validateCreateData': function (data) {

    data = data || {};

    var hasData = Object.keys(data).length;
    var required = ' required for file creation';
    assert(hasData, 'data' + required);
    assert.number(data.task_id, 'data.task_id' + required);
  }
});
