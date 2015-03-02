'use strict';

/**
  * Provides convenience delete methods for working with Wunderlist API endpoints.
  * @module services/Mixin/ServiceDelete
  * @requires module:helpers/URL
  * @requires module:wunderbits/WBMixin
  * @extends module:wunderbits/WBMixin
  */

var core = require('wunderbits.core');
var WBMixin = core.WBMixin;
var assert = core.lib.assert;
var WBDeferred = core.WBDeferred;
var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SERVICE:DELETE');

var URLHelper = require('../../helpers/URL');

module.exports = WBMixin.extend({

  /**
    * Deletes an id from a resource path.
    * @param {number} id - Id of the thing to delete.
    * @param {number} revision - Current locally stored revision of the thing to delete.
    * @param {string} [requestID] - Client supplied request ID
    */
  'deleteID': function (id, revision, requestID) {

    try {
      assert.number(id, 'Deletion requires an id.');
      assert.number(revision, 'Deletion requires a revision.');
    }
    catch (e) {
      localConsole.error(e);
      return new WBDeferred().reject({
        'errors': [e.toString()]
      }, 0).promise();
    }

    var params = {
      'revision': revision
    };

    var paramString = URLHelper.compileParams(params);

    var self = this;
    return self['delete'](self.baseUrl + '/' + id + paramString, undefined, requestID);
  }
});
