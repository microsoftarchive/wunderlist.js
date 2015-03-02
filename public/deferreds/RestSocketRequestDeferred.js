'use strict';

var core = require('wunderbits.core');
var WBDeferred = core.WBDeferred;

var RestSocketRequestDeferred = WBDeferred.extend({

  'properties': {
    'startTime': undefined,
    'endTime': undefined,
    'requestID': undefined,
    'uri': undefined
  }
});

module.exports = RestSocketRequestDeferred;