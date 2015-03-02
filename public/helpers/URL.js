'use strict';

/**
* @module helpers/URL
* @requires module:wunderbits.core/WBSingleton
*/

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;

var URLHelper = WBSingleton.extend({

  /**
    * Compiles hash of request parameters into a valid URI component
    * @param {object} params - Hash of request parameters
    */
  'compileParams': function (params) {

    var first = true;
    var component = '';
    var value;

    for (var key in params) {
      value = encodeURIComponent(params[key]);
      component += (first ? '?' : '&') + key + '=' + encodeURIComponent(value);

      if (first) {
        first = false;
      }
    }

    return component;
  },

  /**
    * Helper for generating full URI from a host (with path) and a params hash.
    * @param {string} host - Host and path part of URI
    * @param {object} params - Hash of URI params and values.
    */
  'generateURI': function (host, params) {

    var self = this;

    return host + self.compileParams(params);
  }
});

module.exports = URLHelper;
