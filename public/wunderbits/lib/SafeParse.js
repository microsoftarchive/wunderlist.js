'use strict';

/**
  * Parse different data types to things
  * @module wunderbits/lib/SafeParse
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  * @requires module:wunderbits/lib/console
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;

var MagiConsole = require('magiconsole');
var localConsole = new MagiConsole('SDK:SAFEPARSE');

var SafeParse = WBSingleton.extend({

  /**
    * Apptempts to parse a json sring to an object without throwing
    * unhandled errors.  Returns undefined if unable to parse json string.
    */
  'json': function (jsonString) {

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      localConsole.warn('Unable to parse "' + jsonString + '"');
    }
    return;
  }
});

module.exports = SafeParse;