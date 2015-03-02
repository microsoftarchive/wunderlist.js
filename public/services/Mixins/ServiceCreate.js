'use strict';

/**
  * Provides convenience method for creating resources
  * @module services/Mixin/ServiceCreate
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:CREATE');

var BaseServiceMixin = require('./BaseServiceMixin');

module.exports = BaseServiceMixin.extend({

  /**
    * Creates a new resource instance view the type's baseURL
    * @param {object} data - Data for the thing being created
    * @param {string} [requestID] - Optional client supplied request id
    *                               (will be auto generated otherwise)
    * @returns {deferred} request - Request deferred object.
    */
  'create': function (data, requestID) {

    var self = this;

    var hasData = data && Object.keys(data).length;

    try {
      assert(hasData, 'Creation requires data.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    data = self.cleanCreateData(data);

    try {
      self.validateData(data, self.type);
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    return self.post(self.baseUrl, data, requestID);
  },

  'cleanCreateData': function (data) {

    for (var key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    }

    return data;
  }
});
