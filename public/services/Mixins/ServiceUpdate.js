'use strict';

/**
  * Provides update convenience methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceUpdate
  * @requires module:helpers/URL
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = require('wunderbits.core');
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:UPDATE');

var BaseServiceMixin = require('./BaseServiceMixin');

module.exports = BaseServiceMixin.extend({

  /**
    * Convenience method for sending resource updates.
    * Handles converting nulls and undefineds to a remove hash.
    * @param {number} id - Id of the thing to update.
    * @param {number} revision - Last known revision of the thing to update.
    * @param {object} updateData - The updates to send to the server.
    * @param {string} [requestID] - Client supplied request ID
    */
  'update': function (id, revision, updateData, requestID) {

    var self = this;
    var hasData = updateData && Object.keys(updateData).length;

    try {
      assert.number(id, 'Updating a resource requires an id of type number.');
      assert.number(revision, 'Updating a resource requires a revision of type number.');
      assert(hasData, 'Updating a resource requires data to be sent.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0);
    }

    updateData.revision = revision;

    self.validateData(updateData, self.type);

    updateData = self.prepareDataForPatch(updateData);

    return self.patch(self.baseUrl + '/' + id, updateData, requestID);
  },

  /**
    * Iterates updateData for null and undefined keys and moves them to the remove array.
    * @param {object} updateDate - The update data.
    */
  'prepareDataForPatch': function (updateData) {

    var removals = [];
    var value;

    for (var key in updateData) {
      value = updateData[key];
      if (value === null || value === undefined) {
        removals.push(key);
        delete updateData[key];
      }
    }

    if (removals.length) {
      updateData.remove = removals;
    }
    return updateData;
  }
});
