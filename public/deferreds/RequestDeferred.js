'use strict';

var core = require('wunderbits.core');
var WBDeferred = core.WBDeferred;

var _super = WBDeferred.prototype;

var RequestDeferred = WBDeferred.extend({

  'properties': {

    'loadDurationTime': undefined,
    'loadStarted': false,
    'loadStartTime': undefined,
    'latencyTime': undefined,

    'startTime': undefined,
    'url': undefined,
    'xhr': undefined,
  },

  'error': _super.fail
});

module.exports = RequestDeferred;