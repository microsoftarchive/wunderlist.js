'use strict';

/**
  * Holds reference for all important analytics platform headers.
  * @module helpers/PlatformHeaders
  * @extends module:wunderbits.core/WBSingleton
  */

var core = require('wunderbits.core');
var WBSingleton = core.WBSingleton;

var navigator = global.navigator || {};
var nodejs = global.process || {};
var userAgent = navigator.userAgent || ('node ' + nodejs.version);

var PlatformHeaders = WBSingleton.extend({
  /**
    * Precompiled platform headers.
    * @type {object}
    */
  'headers': {
    'x-client-platform': 'web',
    'x-client-product':  'wunderlist',
    'x-client-product-version': null,
    'x-client-system': userAgent,
    'x-client-system-version': 'Standard',
    'x-client-product-git-hash': null
  },

  'init': function (options) {

    var self = this;

    var config = options;
    var headers = self.headers;

    headers['x-client-product-version'] = config.release;

    var gitHash = /\[(.*)\]/.exec(config.gitHash);
    gitHash = gitHash && gitHash[1];
    headers['x-client-product-git-hash'] = gitHash || 'dev';

    if (config.testing) {
      headers['x-client-testing'] = 'true';
    }

    if (config.product) {
      headers['x-client-product'] = config.product;
    }
  }
});

module.exports = PlatformHeaders;
