'use strict';

/**
  * Logger that only logs or warns if SDK configured for debug mode.
  * @module helpers/Logger
  * @extends module:wunderbits.core/WBSingleton
  * @requires module:wunderbits.core/WBSingleton
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;

var Console = global.console;

var Logger = WBSingleton.extend({

  'debug': false,

  'enable': function () {

    this.debug = true;
  },

  'disable': function () {

    this.debug = false;
  },

  /** Logs to the console */
  'log': function () {

    this.shouldRun() && Console.log.apply(Console, arguments);
  },

  /** Warns to the console */
  'warn': function () {

    this.shouldRun() && Console.warn.apply(Console, arguments);
  },

  /** Checks if SDK in debug mode */
  'shouldRun': function () {

    return !!(this.debug && Console);
  }
});

module.exports = Logger;
